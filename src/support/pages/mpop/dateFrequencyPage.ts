import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export enum FrequencyOptions {
  EVERY_WEEK = 0,
  EVERY_2_WEEKS = 1,
  EVERY_4_WEEKS = 2,
  EVERY_8_WEEKS = 3,
}

export default class DateFrequencyPage extends MPopBasePage {
  constructor(page: Page, restart = false) {
    super(
      page,
      restart ? "Online check in settings" : "Set up online check ins",
    );
  }

  async completePage(date: string, frequency: FrequencyOptions) {
    await this.fillFields(date, frequency);
  }

  async changePage(date?: string, frequency?: FrequencyOptions) {
    await this.fillFields(date, frequency);
  }

  private async fillFields(date?: string, frequency?: FrequencyOptions) {
    if (date !== undefined) {
      await this.getClass("moj-datepicker").locator('[type="text"]').fill(date);
    }
    if (frequency !== undefined) {
      await this.clickRadioById("checkInFrequency", frequency);
    }
    await this.clickContinue();
  }
}
