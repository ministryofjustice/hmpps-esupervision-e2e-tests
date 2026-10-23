import { Locator, Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class ScheduleCheckInQuestionsPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, /Add questions to .+'s online check in/);
  }

  createButton(): Locator {
    return this.getQA("save-questions-btn");
  }

  async clickCreate(): Promise<void> {
    await this.createButton().click();
  }

  async clickAddQuestion(): Promise<void> {
    await this.getQA("add-question-btn").click();
  }

  customQuestionsTable(): Locator {
    return this.getQA("custom-questions-table");
  }

  customQuestionRow(text: string): Locator {
    return this.customQuestionsTable().locator("tr", { hasText: text });
  }

  cancelLink(): Locator {
    return this.getQA("cancel-link");
  }
}
