import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class EligiblePage extends MPopBasePage {
  constructor(page: Page, crn?: string, uuid?: string) {
    super(page, /[^\s]+ is eligible to use online check ins/, crn, uuid);
  }

  async completePage(id: number) {
    await this.clickRadioById("eligibility-options", id);
    await this.submit();
  }
}
