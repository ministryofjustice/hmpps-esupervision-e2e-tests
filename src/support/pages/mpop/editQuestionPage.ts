import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class EditQuestionPage extends MPopBasePage {
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
