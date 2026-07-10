import { Page, Locator } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class ChooseQuestionPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Choose a question to add");
  }

  addQuestionLink(): Locator {
    return this.getQA("add-question-link").first();
  }

  templateRow(templateText: string): Locator {
    return this.page.getByRole("row", { name: templateText });
  }

  async selectQuestionByTemplate(templateText: string): Promise<void> {
    const row = this.templateRow(templateText);
    await this.getQA("add-question-link", row).click();
  }
}
