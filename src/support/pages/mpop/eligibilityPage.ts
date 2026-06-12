import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class EligibilityPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, /Check if [^\s]+ is eligible to use online check ins/);
  }

  async completePage(ids: number[]) {
    // selects eligibility criteria by checkbox position, which is fragile
    // if the form's question order changes. To be migrated to value based
    // selection in a later PR
    for (const id of ids) {
      await this.page.getByRole("checkbox").nth(id).check();
    }
    await this.clickContinue();
  }
}
