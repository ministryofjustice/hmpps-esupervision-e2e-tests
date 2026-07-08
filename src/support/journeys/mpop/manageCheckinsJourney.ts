import { expect, Page, test } from "@playwright/test";
import {
  ContactDetails,
  Preference,
} from "../../pages/mpop/contactPreferencePage";
import { loginToMpop } from "../../pages/mpop/loginPage";
import { MpopPages } from "../../pages/mpop/mpopPages";
import ManageCheckInsPage from "../../pages/mpop/manageCheckInsPage";
import { FrequencyOptions } from "../../pages/mpop/dateFrequencyPage";

export interface RestartValues {
  date: string;
  frequency: FrequencyOptions;
  preference: Preference;
  contact?: ContactDetails;
}

const FEELING_PREVIEW_OPTIONS = [
  "Very well",
  "Well",
  "OK",
  "Not great",
  "Struggling",
];

const SUPPORT_PREVIEW_CHECKBOXES = [
  "Mental health",
  "Alcohol",
  "Drugs",
  "Money",
  "Housing",
  "Employment and education",
  "Relationships (family, friends, partner",
  "Something else",
  "No, I do not need any support",
];

export default class ManageCheckInsJourney {
  private readonly pages: MpopPages;

  constructor(private readonly page: Page) {
    this.pages = new MpopPages(page);
  }
  async login(): Promise<void> {
    await test.step("Log in to MPOP as practitioner", async () => {
      await loginToMpop(this.page);
    });
  }

  async openManage(crn: string): Promise<ManageCheckInsPage> {
    await test.step(`Open online check ins for ${crn}`, async () => {
      await this.pages.overview.goTo(crn);
      await this.pages.overview.assertOnPage();
      await this.pages.overview.clickViewAllOnlineCheckinDetails();
      await this.pages.manage.assertOnPage();
    });
    return this.pages.manage;
  }

  async stopCheckIns(crn: string, reason: string): Promise<void> {
    await test.step(`Stop online check ins for ${crn}`, async () => {
      const manage = await this.openManage(crn);
      await manage.clickStopCheckIns();
      await this.pages.stop.assertOnPage();
      await this.pages.stop.completePage(reason);
    });
  }

  async restartCheckIns(crn: string, values: RestartValues): Promise<void> {
    await test.step(`Restart online check ins for ${crn}`, async () => {
      const manage = await this.openManage(crn);
      await manage.clickRestartCheckIns();
      await this.pages.restartDateFrequency.assertOnPage();
      await this.pages.restartDateFrequency.completePage(
        values.date,
        values.frequency,
      );
      await this.pages.restartContactPreference.assertOnPage();
      await this.pages.restartContactPreference.completePage(
        values.preference,
        values.contact,
      );
      await this.pages.restartSummary.assertOnPage();
      await this.pages.restartSummary.submitSetUp();
      await this.pages.restartConfirmation.assertOnPage();
    });
  }

  async addQuestions(crn: string, questions: string[]): Promise<void> {
    const manage = await this.goToAddQuestionsPage(crn);
    await this.previewDefaultQuestions();
    await this.enterQuestions(questions);
    await this.pages.addQuestions.clickSaveQuestions();
    await expect(
      manage.questionsAddedBanner(),
      "should show the questions added confirmation",
    ).toBeVisible();
    for (const question of questions) {
      await expect(
        manage.questionCard(),
        `Upcoming check in should list the saved question "${question}"`,
      ).toContainText(question);
    }
  }

  async editAndDeleteQuestions(
    crn: string,
    edit: { from: string; to: string },
    remove: string,
  ): Promise<void> {
    const addPage = this.pages.addQuestions;
    await this.goToAddQuestionsPage(crn);
    await addPage.clickEditQuestion(edit.from);
    await this.pages.editQuestion.assertOnPage();
    await this.pages.editQuestion.enterQuestion(edit.to);
    await addPage.assertOnPage();
    await expect(addPage.customQuestionRow(edit.to)).toBeVisible();
    await expect(addPage.customQuestionRow(edit.from)).toHaveCount(0);

    await addPage.clickDeleteQuestion(remove);
    await addPage.assertOnPage();
    await expect(addPage.customQuestionRow(remove)).toHaveCount(0);
  }

  async goToAddQuestionsPage(crn: string): Promise<ManageCheckInsPage> {
    const manage = await this.openManage(crn);
    await expect(
      manage.changeQuestionsLink(),
      "Change questions link should be present for a future check in",
    ).toBeVisible();

    const nextCheckinDate =
      (await manage.nextCheckinDate().textContent())?.trim() ?? "";
    await manage.clickChangeQuestions();

    await this.pages.howToWriteQuestions.assertOnPage();
    await this.pages.howToWriteQuestions.clickAddQuestions();
    await this.pages.addQuestions.assertOnPage();
    await expect(
      this.pages.addQuestions.nextCheckinDate(),
      "Add questions page should show the same next check in date as manage check in page",
    ).toHaveText(nextCheckinDate);
    return manage;
  }

  private async enterQuestions(questions: string[]): Promise<void> {
    for (let i = 0; i < questions.length; i++) {
      await this.pages.addQuestions.clickAddQuestion();
      await this.pages.chooseQuestion.assertOnPage();
      await this.pages.chooseQuestion.selectQuestion();
      await this.pages.editQuestion.assertOnPage();
      await this.pages.editQuestion.enterQuestion(questions[i]);
      await this.pages.addQuestions.assertOnPage();
    }
    if (questions.length >= 3) {
      await expect(
        this.pages.addQuestions.addQuestionButton(),
        " Add question button should be gone once 3 questions exist",
      ).toHaveCount(0);
    }
  }

  private async previewDefaultQuestions(): Promise<void> {
    await this.pages.addQuestions.clickPreviewFeeling();
    await this.pages.questionPreview.assertOnPage();

    for (const option of FEELING_PREVIEW_OPTIONS) {
      await expect(
        this.pages.questionPreview.feelingRadio(option),
        `Feeling preview should show the "${option}" option`,
      ).toBeVisible();
    }

    await this.pages.questionPreview.clickBackToQuestions();

    await this.pages.addQuestions.assertOnPage();
    await this.pages.addQuestions.clickPreviewSupport();
    await this.pages.questionPreview.assertOnPage();
    for (const checkbox of SUPPORT_PREVIEW_CHECKBOXES) {
      await expect(
        this.pages.questionPreview.supportCheckbox(checkbox),
        `Support preview should show the "${checkbox}" checkbox`,
      ).toBeVisible();
    }
    await this.pages.questionPreview.clickBackToQuestions();
    await this.pages.addQuestions.assertOnPage();
  }

  async assertChangeQuestionsUnavailable(crn: string): Promise<void> {
    const manage = await this.openManage(crn);
    console.log(await expect(manage.changeQuestionsLink()).toHaveCount(0));
    await expect(manage.changeQuestionsLink()).toHaveCount(0);
  }
}
