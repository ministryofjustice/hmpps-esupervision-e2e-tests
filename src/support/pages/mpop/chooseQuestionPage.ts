import { Page, Locator } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class ChooseQuestionPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Choose a question to add");
  }

  addQuestionLink(index = 0): Locator {
    return this.getQA("add-question-link").first();
  }

  async selectQuestion(index = 0): Promise<void> {
    await this.addQuestionLink(index).click();
  }
}
