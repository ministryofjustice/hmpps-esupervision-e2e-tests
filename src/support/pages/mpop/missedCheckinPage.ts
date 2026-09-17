import { Page } from "@playwright/test";
import { MISSED_CHECK_IN_TITLE } from "../../../data/manage-checkins-ui/pageTitles";
import MPopBasePage from "../base/mpopBasePage";

export interface MissedCheckinReview {
  reason: string;
  /** Answer to the sensitive information question. Always given, no default. */
  sensitive: boolean;
}

// The review page for a check in nobody completed. There are no answers to
// look at - the practitioner just records why it was missed. Only appears once
// the check in has expired.
export default class MissedCheckinPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, MISSED_CHECK_IN_TITLE);
  }

  async completePage({
    reason,
    sensitive,
  }: MissedCheckinReview): Promise<void> {
    await this.fillText("notes", reason);
    await this.clickRadioByName("sensitiveContact", this.yesNo(sensitive));
    await this.clickContinue();
  }
}
