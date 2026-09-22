import { Page } from "@playwright/test";
import { MISSED_CHECK_IN_TITLE } from "../../../data/manage-checkins-ui/pageTitles";
import MPopBasePage from "../base/mpopBasePage";
import { MissedReviewDecision } from "../../journeys/mpop/reviewCheckinJourney";

export default class MissedCheckinPage extends MPopBasePage {
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
