import { expect, Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export enum FrequencyOptions {
  EVERY_WEEK = 0,
  EVERY_2_WEEKS = 1,
  EVERY_4_WEEKS = 2,
  EVERY_8_WEEKS = 3,
}

export default class CheckInFrequencyPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, /How often would you like .+ to check in\?/);
  }

  override async assertOnPage(timeout = 10000): Promise<void> {
    await this.assertHeadingOnPage(timeout);
  }

  async completePage(frequency?: FrequencyOptions): Promise<void> {
    if (frequency !== undefined) {
      await this.clickRadioById("checkInFrequency", frequency);
    }
    await this.clickContinue();
  }
}
