import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class QuestionPreviewPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, /feeling since we last spoke|need support with/);
  }

  feelingRadio(name: string): Locator {
    return this.page.getByRole("radio", { name, exact: true });
  }

  supportCheckbox(name: string): Locator {
    return this.page.locator("label.govuk-checkboxes__label", {
      hasText: name,
    });
  }

  async clickBackToQuestions(): Promise<void> {
    await this.getQA("submit-btn").click();
  }
}
