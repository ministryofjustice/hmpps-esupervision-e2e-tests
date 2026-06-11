import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class EligibilityPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, /Check if [^\s]+ is eligible to use online check ins/);
  }

  async completePage(ids: number[]) {
    for (const id of ids) {
      await this.page.getByRole("checkbox").nth(id).check();
    }
    await this.submit();
  }
}
