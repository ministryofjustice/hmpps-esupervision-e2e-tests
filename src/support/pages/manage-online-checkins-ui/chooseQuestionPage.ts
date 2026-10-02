import { Page, Locator } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class ChooseQuestionPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "Choose a question to add");
  }

  templateRow(templateText: string): Locator {
    return this.page.getByRole("row", { name: templateText });
  }

  async selectQuestionByTemplate(templateText: string): Promise<void> {
    const row = this.templateRow(templateText);
    await this.getQA("add-question-link", row).click();
  }
}
