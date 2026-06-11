import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class PartiallyEligiblePage extends MPopBasePage {
  constructor(page: Page) {
    super(
      page,
      /[^\s]+ is eligible to use online check ins as well as existing face-to-face contact/,
    );
  }

  async completePage(): Promise<void> {
    await this.submit();
  }
}
