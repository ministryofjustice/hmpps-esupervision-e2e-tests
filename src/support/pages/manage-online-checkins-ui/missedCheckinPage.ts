import { Page } from "@playwright/test";
import { MISSED_CHECK_IN_TITLE } from "../../../data/manage-online-checkins-ui/pageTitles";
import PractitionerBasePage from "../base/practitionerBasePage";

export interface MissedReviewDecision {
  reason: string;
  sensitive: boolean;
}

export default class MissedCheckinPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, MISSED_CHECK_IN_TITLE);
  }

  async completePage({
    reason,
    sensitive,
  }: MissedReviewDecision): Promise<void> {
    await this.fillText("notes", reason);
    await this.clickRadioByName("sensitiveContact", this.yesNo(sensitive));
    await this.clickContinue();
  }
}
