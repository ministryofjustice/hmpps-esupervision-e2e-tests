import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class EligiblePage extends MPopBasePage {
  constructor(page: Page) {
    super(page, /[^\s]+ is eligible to use online check ins(?! as well as)/);
  }

  async completePage(id: number) {
    await this.clickRadioById("eligibility-options", id);
    await this.clickContinue();
  }
}
