import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class HowToWriteQuestionsPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "How to write questions for an online service");
  }

  async clickAddQuestions(): Promise<void> {
    await this.getQA("submit-btn").click();
  }
}
