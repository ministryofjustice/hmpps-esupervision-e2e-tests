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

const MAX_CUSTOM_QUESTIONS = 3;

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

export interface CustomQuestion {
  template: string;
  text: string;
}
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

  async addQuestions(crn: string, questions: CustomQuestion[]): Promise<void> {
    const manage = await this.goToAddQuestionsPage(crn);
    await test.step("Preview the default feeeling and support questions", () =>
      this.previewDefaultQuestions());
    await test.step(" Add custom questions", async () => {
      await this.enterCustomQuestions(questions);
      if (questions.length >= MAX_CUSTOM_QUESTIONS) {
        await expect(
          this.pages.addQuestions.addQuestionButton(),
          `Add question button should be gone once ${MAX_CUSTOM_QUESTIONS} questions exist`,
        ).toHaveCount(0);
      }
    });

    await this.saveAndVerifyQuestions(
      manage,
      questions.map((q) => q.text),
    );
  }

  async assignQuestions(crn: string, questions: string[]): Promise<void> {
    await test.step("Assign ${questions.length} custom question(s)", async () => {
      const manage = await this.goToAddQuestionsPage(crn);
      await this.enterQuestions(questions);
      await this.pages.addQuestions.clickSaveQuestions();
      await this.assertQuestionsSaved(manage);
    });
  }

  async editAndDeleteQuestions(
    crn: string,
    original: string[],
    edit: { from: string; to: string },
    remove: string,
  ): Promise<string[]> {
    const remainingQuestions = original
      .map((q) => (q === edit.from ? edit.to : q))
      .filter((q) => q !== remove);

    await test.step("Edit and delete configured questions, then save", async () => {
      const addPage = this.pages.addQuestions;
      const manage = await this.goToAddQuestionsPage(crn);

      await addPage.clickEditQuestion(edit.from);
      await this.pages.editQuestion.assertOnPage();
      await this.pages.editQuestion.enterQuestion(edit.to);
      await addPage.assertOnPage();
      await expect(
        addPage.customQuestionRow(edit.to),
        `Edited question "${edit.to}" should appear`,
      ).toBeVisible();

      await expect(
        addPage.customQuestionRow(edit.from),
        `Pre-edit text "${edit.from}" should no longer appear after editing`,
      ).toHaveCount(0);

      await addPage.clickDeleteQuestion(remove);
      await addPage.assertOnPage();
      await expect(
        addPage.customQuestionRow(remove),
        `Deleted question "${remove}" should no longer appear`,
      ).toHaveCount(0);

      await addPage.clickSaveQuestions();
      await this.assertQuestionsSaved(manage);
      await this.assertQuestionCardsContain(manage, remainingQuestions);

      await expect(
        manage.questionCard(),
        `Deleted question "${remove}" should not be saved`,
      ).not.toContainText(remove);
      await expect(
        manage.questionCard(),
        `Pre-edit text "${edit.from}" should be replaced, not retained`,
      ).not.toContainText(edit.from);
    });

    return remainingQuestions;
  }

  async clearCustomQuestions(crn: string, questions: string[]): Promise<void> {
    await test.step("Remove the added questions and save", async () => {
      await this.goToAddQuestionsPage(crn);
      await this.deleteQuestions(questions);
      await this.pages.addQuestions.clickSaveQuestions();
      await this.goToAddQuestionsPage(crn);
      await this.assertQuestionsNotShown(questions);
    });
  }

  private async deleteQuestions(questions: string[]): Promise<void> {
    const addPage = this.pages.addQuestions;
    for (const question of questions) {
      await addPage.clickDeleteQuestion(question);
      await addPage.assertOnPage();
      await expect(
        addPage.customQuestionRow(question),
        `"${question}" should not be shown`,
      ).toHaveCount(0);
    }
  }

  private async assertQuestionsNotShown(questions: string[]): Promise<void> {
    for (const question of questions) {
      await expect(
        this.pages.addQuestions.customQuestionRow(question),
        `"${question}" should not be shown`,
      ).toHaveCount(0);
    }
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

  private async enterCustomQuestions(
    questions: CustomQuestion[],
  ): Promise<void> {
    for (const { template, text } of questions) {
      await this.pages.addQuestions.clickAddQuestion();
      await this.pages.chooseQuestion.assertOnPage();
      await this.pages.chooseQuestion.selectQuestionByTemplate(template);
      await this.pages.editQuestion.assertOnPage();
      await this.pages.editQuestion.enterQuestion(text);
      await this.pages.addQuestions.assertOnPage();
    }
  }

  private async previewDefaultQuestions(): Promise<void> {
    const preview = this.pages.questionPreview;
    await this.pages.addQuestions.clickPreviewFeeling();
    await preview.assertOnPage();

    for (const option of FEELING_PREVIEW_OPTIONS) {
      await expect(
        preview.feelingRadio(option),
        `Feeling preview should show the "${option}" option`,
      ).toBeVisible();
    }

    await preview.clickBackToQuestions();

    await this.pages.addQuestions.assertOnPage();
    await this.pages.addQuestions.clickPreviewSupport();
    await preview.assertOnPage();
    for (const checkbox of SUPPORT_PREVIEW_CHECKBOXES) {
      await expect(
        this.pages.questionPreview.supportCheckbox(checkbox),
        `Support preview should show the "${checkbox}" checkbox`,
      ).toBeVisible();
    }
    await preview.clickBackToQuestions();
    await this.pages.addQuestions.assertOnPage();
  }

  async assertChangeQuestionsUnavailable(crn: string): Promise<void> {
    const manage = await this.openManage(crn);
    console.log(await expect(manage.changeQuestionsLink()).toHaveCount(0));
    await expect(manage.changeQuestionsLink()).toHaveCount(0);
  }

  private async assertQuestionsSaved(
    manage: ManageCheckInsPage,
  ): Promise<void> {
    await expect(
      manage.questionsAddedBanner(),
      "should show the questions added confirmation after saving",
    ).toBeVisible();
  }

  private async saveAndVerifyQuestions(
    manage: ManageCheckInsPage,
    questions: string[],
  ): Promise<void> {
    await test.step("Save and verify the saved questions", async () => {
      await this.pages.addQuestions.clickSaveQuestions();
      await this.assertQuestionsSaved(manage);
      await this.assertQuestionCardsContain(manage, questions);
    });
  }

  private async assertQuestionCardsContain(
    manage: ManageCheckInsPage,
    questions: string[],
  ): Promise<void> {
    for (const question of questions) {
      await expect(
        manage.questionCard(),
        `Upcoming check in should list the saved question "${question}"`,
      ).toContainText(question);
    }
  }
}
