import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";

export const ADDITIONAL_QUESTION_URL = /\/questions\/additional\/\d+/;

export default class AdditionalQuestionPage extends CheckinBasePage {
  constructor(page: Page) {
    // The h1 is the dynamic custom-question text, there is no static heading to assert
    super(page, "");
  }

  answerField(): Locator {
    return this.page.locator("#additionalAnswer");
  }

  async questionText(): Promise<string> {
    return (await this.mainHeading().textContent())?.trim() ?? "";
  }

  async answerAndContinue(answer: string): Promise<void> {
    await this.answerField().fill(answer);
    await this.clickContinue();
  }
}
