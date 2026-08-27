import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export enum FrequencyOptions {
  EVERY_WEEK = 0,
  EVERY_2_WEEKS = 1,
  EVERY_4_WEEKS = 2,
  EVERY_8_WEEKS = 3,
}

type DateFrequencyContext = "setup" | "restart" | "manage";

const HEADINGS: Record<DateFrequencyContext, string> = {
  setup: "Set up online check ins",
  restart: "Online check in settings",
  manage: "Change online check in settings",
};

export default class DateFrequencyPage extends MPopBasePage {
  constructor(page: Page, context: DateFrequencyContext = "setup") {
    super(page, HEADINGS[context]);
  }

  async completePage(date: string, frequency: FrequencyOptions): Promise<void> {
    await this.fillFields(date, frequency);
  }

  async changePage(date?: string, frequency?: FrequencyOptions): Promise<void> {
    await this.fillFields(date, frequency);
  }

  private async fillFields(
    date?: string,
    frequency?: FrequencyOptions,
  ): Promise<void> {
    if (date !== undefined) {
      await this.getClass("moj-datepicker").locator('[type="text"]').fill(date);
    }
    if (frequency !== undefined) {
      await this.clickRadioById("checkInFrequency", frequency);
    }
    await this.clickContinue();
  }
}
