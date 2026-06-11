import { expect, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import OverviewPage from "./overviewPage";

export default class ManageCheckInsPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Online check ins");
  }

  async clickStopCheckIns() {
    await this.getQA("stop-checkin-btn").click();
  }

  async clickRestartCheckIns() {
    await this.getQA("restart-checkin-btn").click();
  }

  async clickChangeQuestions() {
    await this.page.getByRole("link", { name: /Change questions/ }).click();
  }

  async assertCancelAndGoToOverviewLink(linkText: string) {
    await expect(this.getQA("formAnchorLink").nth(0)).toContainText(linkText);
  }

  async selectAddQuestionsToOnlineCheckInsButton() {
    await this.getQA("submit-btn").click();
  }

  async assertTextOnAddQuestionPage(expectedText: string) {
    await expect(this.getQA("pageHeading").nth(0)).toContainText(expectedText);
  }

  async assertPreviewLinks() {
    await expect(this.getQA(`preview-feeling-link`)).toContainText("Preview");
    await expect(this.getQA(`preview-support-link`)).toContainText("Preview");
  }

  async selectPreviewFeelingLink() {
    await this.getQA(`preview-feeling-link`).click();
  }

  async selectBackToQuestionsButton() {
    await this.getQA(`submit-btn`).click();
  }

  async selectPreviewSupportLink() {
    await this.getQA(`preview-support-link`).click();
  }

  async assertAddQuestionButton(expectedButton: string) {
    await expect(this.getQA(`add-question-btn`)).toContainText(expectedButton);
  }

  async assertSaveQuestionsButton(expectedButton: string) {
    await expect(this.getQA(`save-questions-btn`)).toContainText(
      expectedButton,
    );
  }

  async assertCancelAndGoBackLink(expectedLink: string) {
    await expect(this.getQA(`cancel-link`)).toContainText(expectedLink);
  }

  async selectCancelAndGoBackLink() {
    await this.getQA(`cancel-link`).click();
  }
}
