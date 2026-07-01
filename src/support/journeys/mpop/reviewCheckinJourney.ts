import { expect, Locator, Page } from "@playwright/test";
import { MpopPages } from "../../pages/mpop/mpopPages";
import { CompletedCheckinDetails } from "../../../data/models";
import { label, mpopAssistanceLabel } from "../../../data/labels";
import { IdentityDecision } from "../../pages/mpop/reviewIdentityPage";

interface CheckinDetailsView {
  feelingValue(): Locator;
  assistanceValue(): Locator;
}

export const ANNOTATE_READY = false;

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
    await this.openCheckinContact(crn);
    await this.pages.reviewIdentity.assertOnPage();
    await this.pages.reviewIdentity.completePage(identity);
    await this.pages.reviewResponses.assertOnPage();
    if (details) {
      await this.assertShowsCheckinDetails(this.pages.reviewResponses, details);
    }
    await this.pages.reviewResponses.completePage({
      note,
      riskManagement,
      sensitive,
    });
    await this.openCheckinContact(crn);
    await this.pages.reviewedSubmitted.assertOnPage();
    await this.assertReviewIdentityTag(identity);
  }

  private async assertReviewIdentityTag(
    identity: IdentityDecision,
  ): Promise<void> {
    const expected =
      identity === IdentityDecision.NO_MATCH
        ? "Identity not confirmed"
        : "Identity confirmed";
    await expect(
      this.pages.reviewedSubmitted.identityResultTag(),
      `Reviewed page should show "${expected}" for a ${identity} review`,
    ).toContainText(expected);
  }

  async annotateReviewedCheckin(
    crn: string,
    details?: CompletedCheckinDetails,
    annotation: Annotation = {},
  ): Promise<void> {
    const { note = "E2E automated annotation", sensitive = false } = annotation;
    await this.openCheckinContact(crn);
    await this.pages.reviewedSubmitted.assertOnPage();
    if (details) {
      await this.assertShowsCheckinDetails(
        this.pages.reviewedSubmitted,
        details,
      );
    }
    await this.pages.reviewedSubmitted.addNote(note, sensitive);
    await this.openCheckinContact(crn);
    await this.pages.reviewedSubmitted.assertOnPage();
  }

  private async assertShowsCheckinDetails(
    view: CheckinDetailsView,
    details: CompletedCheckinDetails,
  ): Promise<void> {
    await expect(
      view.feelingValue(),
      `Page must show the feeling answer" ${label(details.mentalHealth)}"`,
    ).toContainText(label(details.mentalHealth));

    for (const { option } of details.assistance) {
      const optionLabel = mpopAssistanceLabel(option);
      await expect(
        view.assistanceValue(),
        `Page must show assistance comment for ${optionLabel}`,
      ).toContainText(optionLabel);
    }
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
