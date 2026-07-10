import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";

export const ADDITIONAL_QUESTION_URL = /\/questions\/additional\/\d+/;

export default class AdditionalQuestionPage extends CheckinBasePage {
  constructor(page: Page) {
    // The h1 is the dynamic custom-question text, so there is no stable title
    // to assert on. So used Verified ADDITIONAL_QUESTION_URL by callers
    super(page, "");
  }

  questionHeading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  answerField(): Locator {
    return this.page.locator("#additionalAnswer");
  }

  async questionText(): Promise<string> {
    return (await this.questionHeading().textContent())?.trim() ?? "";
  }

  async answerAndContinue(answer: string): Promise<void> {
    await this.answerField().fill(answer);
    await this.clickContinue();
  }
}
