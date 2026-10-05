import { Locator, Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class EditQuestionPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "What do you want to ask");
  }

  questionInput(): Locator {
    return this.page.locator('input[name*="draftQuestionInput"]');
  }

  async enterQuestion(text: string): Promise<void> {
    await this.questionInput().fill(text);
    await this.getQA("submit-btn").click();
  }
}
