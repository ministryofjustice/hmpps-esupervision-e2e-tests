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
import {
  ADD_QUESTIONS_TITLE,
  CHOOSE_QUESTION_TITLE,
  editQuestionTitle,
  HOW_TO_WRITE_QUESTIONS_TITLE,
  questionPreviewTitle,
} from "../../../data/manage-checkins-ui/pageTitles";
import { assertCaseBanner } from "../../utils/caseBanner";
import { assertManageCheckinsPage } from "../../assertions/manage-checkins-ui/manageCheckinsAssertions";
import { assertExpectedService, LEGACY_MPOP } from "../../utils/legacyMpop";
import { urlPattern } from "../../utils/url";

export default class CustomQuestionsJourney {
  private readonly pages: MpopPages;
  private readonly manage: ManageCheckInsJourney;

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
  ): Promise<void> {
    await manage.clickChangeQuestions();

    await assertExpectedService(this.page, "Questions journey");

    await this.pages.howToWriteQuestions.assertOnPage();
    await assertManageCheckinsPage(
      this.page,
      crn,
      HOW_TO_WRITE_QUESTIONS_TITLE,
    );
    await this.pages.howToWriteQuestions.clickAddQuestions();
    await this.pages.addQuestions.assertOnPage();
    await assertManageCheckinsPage(this.page, crn, ADD_QUESTIONS_TITLE);
    await expect(
      this.pages.addQuestions.nextCheckinDate(),
      "Add questions page should show the same next check in date as manage check in page",
    ).toHaveText(nextCheckinDate);
  }

  private async goToAddQuestionsPage(crn: string): Promise<void> {
    const { manage, nextCheckinDate } =
      await this.openManageForFutureCheckin(crn);
    await this.navigateToAddQuestionsPage(manage, nextCheckinDate, crn);
  }

  private async previewFeelingQuestion(crn: string): Promise<void> {
    const preview = this.pages.questionPreview;
    await this.pages.addQuestions.clickPreviewFeeling();
    await preview.assertOnPage();
    await assertManageCheckinsPage(
      this.page,
      crn,
      questionPreviewTitle(DEFAULT_FEELING_QUESTION_TEXT),
    );

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
    await assertManageCheckinsPage(
      this.page,
      crn,
      questionPreviewTitle(DEFAULT_SUPPORT_QUESTION_TEXT),
    );

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
    firstName: string,
  ): Promise<void> {
    await this.goToAddQuestionsPage(crn);
    await test.step("Preview the default feeling and support questions", () =>
      this.previewDefaultQuestions(crn));
    await test.step("Add custom questions", async () =>
      await this.enterCustomQuestions(questions, crn));
    await this.saveAndVerifyQuestions(
      crn,
      questions.map((q) => q.text),
      firstName,
    );
  }

  // for e2e setup: adds and saves custom questions without preview/verify steps that addCustomQuestions covers
  async assignCustomQuestions(
    crn: string,
    questions: CustomQuestion[],
  ): Promise<void> {
    await test.step(`Assign ${questions.length} custom question(s)`, async () => {
      await this.goToAddQuestionsPage(crn);
      await this.enterCustomQuestions(questions, crn);
      await this.save(crn);
    });
  }

  async editAndDeleteCustomQuestions(
    crn: string,
    original: string[],
    edit: { from: string; to: string; template: string },
    remove: string,
  ): Promise<string[]> {
    const remainingQuestions = original
      .map((q) => (q === edit.from ? edit.to : q))
      .filter((q) => q !== remove);

    await test.step("Edit and delete configured questions, then save", async () => {
      const addPage = this.pages.addQuestions;
      await this.goToAddQuestionsPage(crn);

      await addPage.clickEditQuestion(edit.from);
      await this.pages.editQuestion.assertOnPage();
      await assertManageCheckinsPage(
        this.page,
        crn,
        editQuestionTitle(edit.template),
      );
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
      // saveAndVerifyQuestions leaves the browser on the manage check in page.
      await this.saveAndVerifyQuestions(crn, remainingQuestions);
      const manage = new ManageCheckInsPage(this.page);
      await expect(
        manage.questionCard(),
        `Deleted question "${remove}" should not be saved`,
      ).not.toContainText(remove);
    });

    return remainingQuestions;
  }

  async clearCustomQuestions(crn: string, questions: string[]): Promise<void> {
    await test.step("Remove the added questions and save", async () => {
      await this.goToAddQuestionsPage(crn);
      await this.deleteQuestions(questions);
      await this.save(crn);
      await this.goToAddQuestionsPage(crn);
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
      await assertManageCheckinsPage(this.page, crn, CHOOSE_QUESTION_TITLE);
      await this.pages.chooseQuestion.selectQuestionByTemplate(template);
      await this.pages.editQuestion.assertOnPage();
      await assertManageCheckinsPage(
        this.page,
        crn,
        editQuestionTitle(template),
      );
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

  // firstName is only known (and only asserted) when adding questions - edit/delete
  // flows don't show this "questions added" banner.
  private async save(crn: string, firstName?: string): Promise<void> {
    await this.pages.addQuestions.clickSaveQuestions();
    // TODO(legacy-mpop): Delete the else branch and unindent when legacy MPOP is
    // removed. Saving lands on the MOCI manage page but on the MPOP case overview.
    if (!LEGACY_MPOP) {
      await expect(
        this.page,
        "Saving questions should land on the manage-checkins-ui manage page",
      ).toHaveURL(
        urlPattern(
          env.manageCheckinsUiUrl(),
          `/case/${crn}/appointments/check-in/manage/`,
        ),
      );
      await assertCaseBanner(this.page, crn);
      if (firstName) {
        await expect(
          this.pages.manage.questionsAddedBanner(firstName),
          `Should confirm questions were added to ${firstName}'s next check in`,
        ).toBeVisible();
      }
    } else {
      await expect(
        this.page,
        "Saving questions should land back on the MPOP case overview",
      ).toHaveURL(urlPattern(env.mpopUrl(), `/case/${crn}`));
    }
  }

  private async saveAndVerifyQuestions(
    crn: string,
    questions: string[],
    firstName?: string,
  ): Promise<void> {
    await test.step("Save and verify the saved questions", async () => {
      await this.save(crn, firstName);
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
