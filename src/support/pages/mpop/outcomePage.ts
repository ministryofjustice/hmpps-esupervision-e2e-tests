import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class OutcomePage extends MPopBasePage {
  constructor(page: Page, heading: string | RegExp) {
    super(page, heading);
  }

  async completePage(): Promise<void> {
    await this.clickContinue();
  }
}
