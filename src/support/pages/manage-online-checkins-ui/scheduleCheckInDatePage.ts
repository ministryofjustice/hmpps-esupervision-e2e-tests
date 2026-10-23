import { expect, Locator, Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class ScheduleCheckInDatePage extends PractitionerBasePage {
  constructor(page: Page) {
    super(
      page,
      "When would you like the person to complete their online check in?",
    );
  }

  override async assertOnPage(timeout = 10000): Promise<void> {
    await expect(this.getQA("checkInDate")).toBeVisible({ timeout });
    await expect(this.dateInput()).toBeVisible({ timeout });
  }

  dateInput(): Locator {
    return this.page.getByLabel(this.heading, { exact: true });
  }

  async completePage(date: string): Promise<void> {
    await this.dateInput().fill(date);
    await this.clickContinue();
  }
}
