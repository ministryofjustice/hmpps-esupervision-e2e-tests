import test, { expect, Page } from "@playwright/test";
import { MpopPages } from "../../pages/mpop/mpopPages";
import ManageCheckInsJourney from "./manageCheckinsJourney";
import ManageCheckInsPage from "../../pages/mpop/manageCheckInsPage";
import { CustomQuestion } from "../../../data/models";
import {
  FEELING_PREVIEW_OPTIONS,
  SUPPORT_PREVIEW_CHECKBOXES,
  MAX_CUSTOM_QUESTIONS,
  DEFAULT_FEELING_QUESTION_TEXT,
  DEFAULT_SUPPORT_QUESTION_TEXT,
} from "../../../data/mpop/customQuestionConstants";
import { env } from "../../../config/env";
import { assertManageOnlineCheckinsUiTitle } from "../../utils/pageTitle";
import {
  ADD_QUESTIONS_TITLE,
  CHOOSE_QUESTION_TITLE,
  editQuestionTitle,
  HOW_TO_WRITE_QUESTIONS_TITLE,
  questionPreviewTitle,
} from "../../../data/manage-checkins-ui/pageTitles";
import { assertOnExpectedUi, ExpectedUi } from "../../utils/expectedUi";
import { assertCaseBanner } from "../../utils/caseBanner";

export default class CustomQuestionsJourney {
  private readonly pages: MpopPages;
  private readonly manage: ManageCheckInsJourney;
  private onNewUi = false;

  constructor(private readonly page: Page) {
    this.manage = new ManageCheckInsJourney(page);
    this.pages = new MpopPages(page);
  }

  async login(): Promise<void> {
    return this.manage.login();
  }

  private async openManageForFutureCheckin(
    crn: string,
  ): Promise<{ manage: ManageCheckInsPage; nextCheckinDate: string }> {
    const manage = await this.manage.openManage(crn);
    await expect(
      manage.changeQuestionsLink(),
      "Change questions link should be present for a future check in",
    ).toBeVisible();

    const nextCheckinDate =
      (await manage.nextCheckinDate().textContent())?.trim() ?? "";
    return { manage, nextCheckinDate };
  }

  private async navigateToAddQuestionsPage(
    manage: ManageCheckInsPage,
    nextCheckinDate: string,
    crn: string,
    expectedUi?: ExpectedUi,
  ): Promise<void> {
    await manage.clickChangeQuestions();

    this.onNewUi = assertOnExpectedUi(
      this.page,
      "Questions journey",
      expectedUi,
    );

    await this.pages.howToWriteQuestions.assertOnPage();
    if (this.onNewUi) {
      await assertManageOnlineCheckinsUiTitle(
        this.page,
        HOW_TO_WRITE_QUESTIONS_TITLE,
      );
      await assertCaseBanner(this.page, crn);
    }
    await this.pages.howToWriteQuestions.clickAddQuestions();
    await this.pages.addQuestions.assertOnPage();
    if (this.onNewUi) {
      await assertManageOnlineCheckinsUiTitle(this.page, ADD_QUESTIONS_TITLE);
      await assertCaseBanner(this.page, crn);
    }
    await expect(
      this.pages.addQuestions.nextCheckinDate(),
      "Add questions page should show the same next check in date as manage check in page",
    ).toHaveText(nextCheckinDate);
  }

  private async goToAddQuestionsPage(
    crn: string,
    expectedUi?: ExpectedUi,
  ): Promise<ManageCheckInsPage> {
    const { manage, nextCheckinDate } =
      await this.openManageForFutureCheckin(crn);
    await this.navigateToAddQuestionsPage(
      manage,
      nextCheckinDate,
      crn,
      expectedUi,
    );
    return manage;
  }

  private async previewFeelingQuestion(crn: string): Promise<void> {
    const preview = this.pages.questionPreview;
    await this.pages.addQuestions.clickPreviewFeeling();
    await preview.assertOnPage();
    if (this.onNewUi) {
      await assertManageOnlineCheckinsUiTitle(
        this.page,
        questionPreviewTitle(DEFAULT_FEELING_QUESTION_TEXT),
      );
      await assertCaseBanner(this.page, crn);
    }

    for (const option of FEELING_PREVIEW_OPTIONS) {
      await expect(
        preview.feelingRadio(option),
        `Feeling preview should show the "${option}" option`,
      ).toBeVisible();
    }

    await preview.clickBackToQuestions();

    await this.pages.addQuestions.assertOnPage();
  }

  private async previewSupportQuestion(crn: string): Promise<void> {
    const preview = this.pages.questionPreview;

    await this.pages.addQuestions.clickPreviewSupport();
    await preview.assertOnPage();
    if (this.onNewUi) {
      await assertManageOnlineCheckinsUiTitle(
        this.page,
        questionPreviewTitle(DEFAULT_SUPPORT_QUESTION_TEXT),
      );
      await assertCaseBanner(this.page, crn);
    }

    for (const checkbox of SUPPORT_PREVIEW_CHECKBOXES) {
      await expect(
        preview.supportCheckbox(checkbox),
        `Support preview should show the "${checkbox}" checkbox`,
      ).toBeVisible();
    }
    await preview.clickBackToQuestions();
    await this.pages.addQuestions.assertOnPage();
  }

  private async previewDefaultQuestions(crn: string): Promise<void> {
    await this.previewFeelingQuestion(crn);
    await this.previewSupportQuestion(crn);
  }

  async addCustomQuestions(
    crn: string,
    questions: CustomQuestion[],
    expectedUi?: ExpectedUi,
  ): Promise<void> {
    await this.goToAddQuestionsPage(crn, expectedUi);
    await test.step("Preview the default feeling and support questions", () =>
      this.previewDefaultQuestions(crn));
    await test.step("Add custom questions", async () =>
      await this.enterCustomQuestions(questions, crn));
    await this.saveAndVerifyQuestions(
      crn,
      questions.map((q) => q.text),
    );
  }

  // for e2e setup: adds and saves custom questions without preview/verify steps that addCustomQuestions covers
  async assignCustomQuestions(
    crn: string,
    questions: CustomQuestion[],
    expectedUi?: ExpectedUi,
  ): Promise<void> {
    await test.step(`Assign ${questions.length} custom question(s)`, async () => {
      await this.goToAddQuestionsPage(crn, expectedUi);
      await this.enterCustomQuestions(questions, crn);
      await this.save(crn);
    });
  }

  async editAndDeleteCustomQuestions(
    crn: string,
    original: string[],
    edit: { from: string; to: string; template: string },
    remove: string,
    expectedUi?: ExpectedUi,
  ): Promise<string[]> {
    const remainingQuestions = original
      .map((q) => (q === edit.from ? edit.to : q))
      .filter((q) => q !== remove);

    await test.step("Edit and delete configured questions, then save", async () => {
      const addPage = this.pages.addQuestions;
      await this.goToAddQuestionsPage(crn, expectedUi);

      await addPage.clickEditQuestion(edit.from);
      await this.pages.editQuestion.assertOnPage();
      if (this.onNewUi) {
        await assertManageOnlineCheckinsUiTitle(
          this.page,
          editQuestionTitle(edit.template),
        );
        await assertCaseBanner(this.page, crn);
      }
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

      await this.deleteQuestions([remove]);
      // saveAndVerify questions leaves the browser on the manage check in page, so rewrap
      // the current page to run to the deleted question check
      await this.saveAndVerifyQuestions(crn, remainingQuestions);
      const manage = new ManageCheckInsPage(this.page);
      await expect(
        manage.questionCard(),
        `Deleted question "${remove}" should not be saved`,
      ).not.toContainText(remove);
    });

    return remainingQuestions;
  }

  async clearCustomQuestions(
    crn: string,
    questions: string[],
    expectedUi?: ExpectedUi,
  ): Promise<void> {
    await test.step("Remove the added questions and save", async () => {
      await this.goToAddQuestionsPage(crn, expectedUi);
      await this.deleteQuestions(questions);
      await this.save(crn);
      await this.goToAddQuestionsPage(crn, expectedUi);
      await this.assertQuestionsNotShown(questions);
    });
  }
  async assertChangeQuestionsUnavailable(crn: string): Promise<void> {
    const manage = await this.manage.openManage(crn);
    await expect(
      manage.changeQuestionsLink(),
      "Change questions link should not be available",
    ).toHaveCount(0);
  }

  private async enterCustomQuestions(
    questions: CustomQuestion[],
    crn: string,
  ): Promise<void> {
    for (const { template, text } of questions) {
      await this.pages.addQuestions.clickAddQuestion();
      await this.pages.chooseQuestion.assertOnPage();
      if (this.onNewUi) {
        await assertManageOnlineCheckinsUiTitle(
          this.page,
          CHOOSE_QUESTION_TITLE,
        );
        await assertCaseBanner(this.page, crn);
      }
      await this.pages.chooseQuestion.selectQuestionByTemplate(template);
      await this.pages.editQuestion.assertOnPage();
      if (this.onNewUi) {
        await assertManageOnlineCheckinsUiTitle(
          this.page,
          editQuestionTitle(template),
        );
        await assertCaseBanner(this.page, crn);
      }
      await this.pages.editQuestion.enterQuestion(text);
      await this.pages.addQuestions.assertOnPage();
    }
    await this.assertAddQuestionButtonUnavailableAtLimit(questions.length);
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

  private async save(crn: string): Promise<void> {
    await this.pages.addQuestions.clickSaveQuestions();
    if (this.onNewUi) {
   
      await expect(
        this.page,
        "Saving questions should land on the manage-checkins-ui manage page",
      ).toHaveURL(
        new RegExp(
          `^${env.manageCheckinsUiUrl()}/case/${crn}/appointments/check-in/manage/`,
        ),
      );
      await assertCaseBanner(this.page, crn);
    } else {
      await expect(
        this.page,
        "Saving questions should land back on the MPOP case overview",
      ).toHaveURL(new RegExp(`^${env.mpopUrl()}/case/${crn}`));

      if (
        new RegExp(`^${env.mpopUrl()}/case/${crn}/?$`).test(this.page.url())
      ) {
        await this.assertQuestionsAddedBanner(
          new ManageCheckInsPage(this.page),
        );
      }
    }
  }

  private async saveAndVerifyQuestions(
    crn: string,
    questions: string[],
  ): Promise<void> {
    await test.step("Save and verify the saved questions", async () => {
      await this.save(crn);
      // save currently lands on MPOP overview, so reopen the manage check in page to verify saved questions
      const manage = await this.manage.openManage(crn);
      await this.assertQuestionCardsContain(manage, questions);
    });
  }

  private async assertQuestionsNotShown(questions: string[]): Promise<void> {
    for (const question of questions) {
      await expect(
        this.pages.addQuestions.customQuestionRow(question),
        `"${question}" should not be shown`,
      ).toHaveCount(0);
    }
  }

  private async assertAddQuestionButtonUnavailableAtLimit(
    questionCount: number,
  ): Promise<void> {
    if (questionCount >= MAX_CUSTOM_QUESTIONS) {
      await expect(
        this.pages.addQuestions.addQuestionButton(),
        `Add question button should be gone once ${MAX_CUSTOM_QUESTIONS} questions exist`,
      ).toHaveCount(0);
    }
  }

  private async assertQuestionsAddedBanner(
    manage: ManageCheckInsPage,
  ): Promise<void> {
    await expect(
      manage.questionsAddedBanner(),
      "Should show the questions added confirmation after saving",
    ).toBeVisible();
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
