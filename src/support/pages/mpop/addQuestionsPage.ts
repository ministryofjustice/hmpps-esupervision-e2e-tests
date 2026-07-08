import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class AddQuestionsPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Add questions to");
  }

  nextCheckinDate(): Locator {
    return this.page
      .locator("p", { hasText: "next online check in on" })
      .locator("b");
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

  addQuestionButton(): Locator {
    return this.getQA("add-question-btn");
  }

  async clickAddQuestion(): Promise<void> {
    await this.addQuestionButton().click();
  }

  async clickSaveQuestions(): Promise<void> {
    await this.saveButton().click();
  }

  customQuestionRow(text: string): Locator {
    return this.getQA("custom-questions-table").locator("tr", {
      hasText: text,
    });
  }

  async clickEditQuestion(text: string): Promise<void> {
    await this.getQA(
      "edit-question-link",
      this.customQuestionRow(text),
    ).click();
  }

  async clickDeleteQuestion(text: string): Promise<void> {
    await this.getQA(
      "delete-question-link",
      this.customQuestionRow(text),
    ).click();
  }
}
