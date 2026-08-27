import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export enum IdentityDecision {
  MATCH = "MATCH",
  MATCH_WITH_CONCERN = "MATCH_WITH_CONCERN",
  NO_MATCH = "NO_MATCH",
}

export default class ReviewIdentityPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Online check in submitted");
  }

  // This page and the review notes page share the heading "Online check in
  // submitted", so the radios are what tell them apart.
  identityGroup(): Locator {
    return this.getQA("confirmIdentity");
  }

  /** Submit without choosing, to reach this page's validation. */
  async submitWithoutDecision(): Promise<void> {
    await this.clickContinue();
  }

  async completePage(
    decision: IdentityDecision = IdentityDecision.MATCH,
  ): Promise<void> {
    await this.clickRadioByValue("confirmIdentity", decision);
    await this.clickContinue();
  }
}
