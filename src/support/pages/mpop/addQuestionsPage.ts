import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class AddQuestionsPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Add questions to");
  }

  previewFeelingLInk(): Locator {
    return this.getQA("preview-feeling-link");
  }

  previewSupportLink(): Locator {
    return this.getQA("preview-support-link");
  }

  saveButton(): Locator {
    return this.getQA("save-questions-btn");
  }

  async clickPreviewFeeling(): Promise<void> {
    await this.previewFeelingLInk().click();
  }

  async clickPreviewSupport(): Promise<void> {
    await this.previewSupportLink().click();
  }

  async clickAddQuestion(): Promise<void> {
    await this.getQA("add-question-btn").click();
  }

  async clickSaveQuestions(): Promise<void> {
    await this.saveButton().click();
  }
}
