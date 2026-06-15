import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class SpoApprovalPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Check you've got approval before you sign");
  }

  async completePage() {
    await this.page.getByRole("checkbox").check();
    await this.clickContinue();
  }
}
