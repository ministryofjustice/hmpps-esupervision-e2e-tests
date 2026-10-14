import { Locator, Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class CheckInDatePage extends PractitionerBasePage {
  constructor(page: Page) {
    super(
      page,
      new RegExp(
        `When would you like .+ to complete their (first|next) online check in\\?`,
      ),
    );
  }

  override async assertOnPage(timeout = 10000): Promise<void> {
    await this.assertHeadingOnPage(timeout);
  }

  dateInput(): Locator {
    return this.getClass("moj-datepicker").locator('[type="text"]');
  }

  async completePage(date?: string): Promise<void> {
    if (date !== undefined) {
      await this.dateInput().fill(date);
    }
    await this.clickContinue();
  }
}
