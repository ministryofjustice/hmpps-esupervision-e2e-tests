import { Page } from "@playwright/test";
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

  async completePage(
    decision: IdentityDecision = IdentityDecision.MATCH,
  ): Promise<void> {
    await this.clickRadioByValue("confirmIdentity", decision);
    await this.clickContinue();
  }
}
