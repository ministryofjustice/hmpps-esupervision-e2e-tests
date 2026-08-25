import { expect, Locator, Page, test } from "@playwright/test";
import { MpopPages } from "../../pages/mpop/mpopPages";
import { loginToMpop } from "../../pages/mpop/loginPage";
import {
  AdditionalAnswer,
  CompletedCheckinDetails,
} from "../../../data/models";
import {
  label,
  mpopAssistanceCommentKey,
  mpopAssistanceLabel,
} from "../../../data/labels";
import { IdentityDecision } from "../../pages/mpop/reviewIdentityPage";
import {
  REVIEW_IDENTITY_TITLE,
  REVIEW_QUESTIONS_TITLE,
  REVIEWED_CHECK_IN_TITLE,
} from "../../../data/manage-checkins-ui/pageTitles";
import { assertExpectedService } from "../../utils/legacyMpop";
import { assertManageCheckinsPage } from "../../assertions/manage-checkins-ui/manageCheckinsAssertions";

interface CheckinDetailsView {
  feelingValue(): Locator;
  assistanceValue(): Locator;
  summaryValueByKey(key: string): Locator;
}

export interface ReviewDecision {
  identity?: IdentityDecision;
  note?: string;
  riskManagement?: boolean;
  sensitive?: boolean;
  /**
   * Submit each review page once with its safeguarding answer missing and assert
   * it refuses, then answer properly - covered inside a review already happening.
   */
  assertValidation?: boolean;
}

export interface Annotation {
  note?: string;
  sensitive?: boolean;
}

export default class ReviewCheckinJourney {
  private readonly pages: MpopPages;

  constructor(private readonly page: Page) {
    this.pages = new MpopPages(page);
  }

  async login(): Promise<void> {
    await test.step("Log in to MPOP as practitioner", async () => {
      await loginToMpop(this.page);
    });
  }

  async reviewCompletedCheckin(
    crn: string,
    decision: ReviewDecision = {},
    details?: CompletedCheckinDetails,
  ): Promise<void> {
    const {
      identity = IdentityDecision.MATCH,
      note = "E2E automated review checkin",
      riskManagement = false,
      sensitive = false,
    } = decision;

    // Review the check in: Identity page, then the review notes page
    await this.openCheckinContact(crn);
    await this.pages.reviewIdentity.assertOnPage();
    await assertManageCheckinsPage(this.page, crn, REVIEW_IDENTITY_TITLE);
    if (decision.assertValidation) {
      await this.assertIdentityDecisionRequired();
    }
    await this.pages.reviewIdentity.completePage(identity);

    await this.pages.reviewNotes.assertOnPage();
    await assertManageCheckinsPage(this.page, crn, REVIEW_QUESTIONS_TITLE);
    await expect(
      this.pages.reviewNotes.notesField(),
      "Should be on the review notes page, not still on identity",
    ).toBeVisible();
    if (details) {
      await this.assertCheckinDetails(this.pages.reviewNotes, details);
    }
    if (decision.assertValidation) {
      await this.assertSensitiveAnswerRequired(note, riskManagement);
    }
    await this.pages.reviewNotes.completePage({
      note,
      riskManagement,
      sensitive,
    });

    // Re-open the check in and verify the review was saved
    await this.openCheckinContact(crn);
    await this.pages.reviewedCheckin.assertOnPage();
    await assertManageCheckinsPage(this.page, crn, REVIEWED_CHECK_IN_TITLE);
    await this.assertReviewIdentityTag(identity);
    await this.assertReviewSummaryShows(note);
    if (details) {
      await this.assertCheckinDetails(this.pages.reviewedCheckin, details);
    }
    await this.assertIdentityImages(identity);
  }

  /** Without an identity decision an unverified check in would be filed as reviewed. */
  private async assertIdentityDecisionRequired(): Promise<void> {
    const message =
      "Select if the person in the check in image is the right person";
    const identity = this.pages.reviewIdentity;

    await identity.submitWithoutDecision();
    await expect(identity.errorSummary()).toContainText(message);
    await expect(identity.fieldError(message)).toBeVisible();
    await expect(
      identity.identityGroup(),
      "Should stay on the identity page after a failed submit",
    ).toBeVisible();
  }

  /** The sensitive answer governs disclosure, so a review must not be filed without one. */
  private async assertSensitiveAnswerRequired(
    note: string,
    riskManagement: boolean,
  ): Promise<void> {
    const message =
      "Select if this online check in includes sensitive information";
    const notes = this.pages.reviewNotes;

    await notes.submitWithoutSensitiveAnswer(note, riskManagement);
    await expect(notes.errorSummary()).toContainText(message);
    await expect(notes.fieldError(message)).toBeVisible();
    await expect(
      notes.notesField(),
      "Should stay on the review notes page after a failed submit",
    ).toBeVisible();
  }

  async annotateReviewedCheckin(
    crn: string,
    annotation: Annotation = {},
  ): Promise<void> {
    const { note = "E2E automated annotation", sensitive = false } = annotation;
    await this.openCheckinContact(crn);
    await this.pages.reviewedCheckin.assertOnPage();
    await this.pages.reviewedCheckin.addNote(note, sensitive);

    // Re-open and verify the note was saved
    await this.openCheckinContact(crn);
    await this.pages.reviewedCheckin.assertOnPage();
    await this.assertReviewSummaryShows(note);
  }

  private async assertReviewSummaryShows(note: string): Promise<void> {
    const text = note.trim();
    await expect(
      this.pages.reviewedCheckin.reviewSummary(),
      `Reviewed page should show the note "${text}"`,
    ).toContainText(text);
  }

  // Identity tag reads "not confirmed" for NO_MATCH, "confirmed" otherwise
  private async assertReviewIdentityTag(
    identity: IdentityDecision,
  ): Promise<void> {
    const expected =
      identity === IdentityDecision.NO_MATCH
        ? "Identity not confirmed"
        : "Identity confirmed";
    await expect(
      this.pages.reviewedCheckin.identityResultTag(),
      `Identity tag should read "${expected}"`,
    ).toContainText(expected);
  }

  private async assertCheckinDetails(
    view: CheckinDetailsView,
    details: CompletedCheckinDetails,
  ): Promise<void> {
    const feeling = label(details.mentalHealth);
    await expect(
      view.feelingValue(),
      `Feeling should show "${feeling}"`,
    ).toContainText(feeling);
    const assistanceRow = view.assistanceValue();
    for (const { option, comment } of details.assistance) {
      const optionLabel = mpopAssistanceLabel(option);
      await expect(
        assistanceRow,
        `Assistance should list "${optionLabel}"`,
      ).toContainText(optionLabel);
      await expect(
        view.summaryValueByKey(mpopAssistanceCommentKey(option)),
        `Comment for "${optionLabel}" should show comment "${comment}"`,
      ).toContainText(comment);
    }
    await this.assertAdditionalAnswers(view, details.additional);
  }

  private async assertAdditionalAnswers(
    view: CheckinDetailsView,
    additional: AdditionalAnswer[],
  ): Promise<void> {
    for (const { question, answer } of additional) {
      await expect(
        view.summaryValueByKey(question),
        `Custom question "${question}" should show "${answer}"`,
      ).toContainText(answer);
    }
  }

  // Decision driven: the reference photo shows only on NO_MATCH and the check in
  // row on anything other than MATCH. Liveness is skipped, so it reads
  // "No image available"
  private async assertIdentityImages(
    identity: IdentityDecision,
  ): Promise<void> {
    const showsReferencePhoto = identity === IdentityDecision.NO_MATCH;
    const showsCheckinImageRow = identity !== IdentityDecision.MATCH;

    await this.assertShown(
      "Reference image",
      this.pages.reviewedCheckin.referenceImage(),
      showsReferencePhoto,
    );

    await this.assertShown(
      "Check in image row",
      this.pages.reviewedCheckin.checkinImageRow(),
      showsCheckinImageRow,
    );

    if (showsCheckinImageRow) {
      await expect(
        this.pages.reviewedCheckin.checkinImageRow(),
        "Liveness is skipped, so the check in image row should read 'No image available",
      ).toContainText("No image available");
    }
  }

  // assert an element is present exactly once, or not present at all
  private async assertShown(
    name: string,
    locator: Locator,
    shown: boolean,
  ): Promise<void> {
    await expect(
      locator,
      shown ? `${name} should be shown` : `${name} should not be shown`,
    ).toHaveCount(shown ? 1 : 0);
  }

  private async openCheckinContact(crn: string): Promise<void> {
    await expect(async () => {
      await this.pages.overview.goTo(crn);
      await this.pages.overview.clickActivityLogTab();
      await this.pages.activityLog.assertOnPage();
      await expect(this.pages.activityLog.manageCheckinLink()).toBeVisible({
        timeout: 5000,
      });
    }).toPass({ timeout: 60000, intervals: [3000, 5000, 10000] });
    await this.pages.activityLog.openCheckinReview();
    await assertExpectedService(this.page, "Review journey");
  }
}
