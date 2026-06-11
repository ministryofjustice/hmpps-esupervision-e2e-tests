import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class IneligiblePage extends MPopBasePage {
  constructor(page: Page) {
    super(page, /[^\s]+ is not eligible to use online check ins/);
  }

  async completePage() {
    await this.submit();
  }
}
