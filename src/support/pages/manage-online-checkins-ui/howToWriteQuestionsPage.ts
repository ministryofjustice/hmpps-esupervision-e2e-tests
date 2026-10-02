import { Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class HowToWriteQuestionsPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "How to write questions for an online service");
  }

  async clickAddQuestions(): Promise<void> {
    await this.getQA("submit-btn").click();
  }
}
