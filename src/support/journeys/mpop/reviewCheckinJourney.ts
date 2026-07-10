import { expect, Locator, Page } from "@playwright/test";
import { MpopPages } from "../../pages/mpop/mpopPages";
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
    await this.pages.reviewIdentity.completePage(identity);

    await this.pages.reviewNotes.assertOnPage();
    await expect(
      this.pages.reviewNotes.notesField(),
      "Should be on the review notes page, not still on identity",
    ).toBeVisible();
    if (details) {
      await this.assertCheckinDetails(this.pages.reviewNotes, details);
    }
    await this.pages.reviewNotes.completePage({
      note,
      riskManagement,
      sensitive,
    });

    // Re-open the check in and verify the review was saved
    await this.openCheckinContact(crn);
    await this.pages.reviewedCheckin.assertOnPage();
    await this.assertReviewIdentityTag(identity);
    await this.assertReviewSummaryShows(note);
    if (details) {
      await this.assertCheckinDetails(this.pages.reviewedCheckin, details);
    }
    await this.assertIdentityImages(identity);
  }

  async annotateReviewedCheckin(
    crn: string,
    annotation: Annotation = {},
    additional: AdditionalAnswer[] = [],
  ): Promise<void> {
    const { note = "E2E automated annotation", sensitive = false } = annotation;
    await this.openCheckinContact(crn);
    await this.pages.reviewedCheckin.assertOnPage();
    await this.pages.reviewedCheckin.addNote(note, sensitive);

    // Re-open and verify the note was saved
    await this.openCheckinContact(crn);
    await this.pages.reviewedCheckin.assertOnPage();
    await this.assertReviewSummaryShows(note);
    await this.assertAdditionalAnswers(this.pages.reviewedCheckin, additional);
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
    await this.assertAdditionalAnswers(view, details.additional ?? []);
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

  // Identity images are decision driven: the reference photo shows only on
  // NO_MATCH, the check in image row on anything other than MATCH. Liveness is skipped
  // so the check in row shows it reads "No image available"
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
  }
}
