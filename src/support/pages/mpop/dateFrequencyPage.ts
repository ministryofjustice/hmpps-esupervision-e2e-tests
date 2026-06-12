import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export enum FrequencyOptions {
  EVERY_WEEK = 0,
  EVERY_2_WEEKS = 1,
  EVERY_4_WEEKS = 2,
  EVERY_8_WEEKS = 3,
}

export default class DateFrequencyPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Set up online check ins");
  }

  async completePage(date: string, frequencyId: number) {
    await this.fillFields(date, frequencyId);
  }

  async changePage(date?: string, frequencyId?: number) {
    await this.fillFields(date, frequencyId);
  }

  private async fillFields(date?: string, frequencyId?: number) {
    if (date !== undefined) {
      await this.getClass("moj-datepicker").locator('[type="text"]').fill(date);
    }
    if (frequencyId !== undefined) {
      await this.clickRadioById("checkInFrequency", frequencyId);
    }
    await this.clickContinue();
  }
}
