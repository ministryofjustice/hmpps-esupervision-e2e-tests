import { Locator, Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class RationalePage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, /suitable to use online check ins/i);
  }

  private rationaleTextbox(): Locator {
    return this.getQA("rationale-for-check-ins").getByRole("textbox");
  }

  async completePage(rationale: string): Promise<void> {
    await this.rationaleTextbox().fill(rationale);
    await this.clickContinue();
  }
}
