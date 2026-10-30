import test, { expect, Page } from "@playwright/test";
import { ManageCheckinsPages } from "../../pages/manage-online-checkins-ui/manageCheckinsPages";
import ManageCheckInsJourney from "./manageCheckinsJourney";
import ManageCheckInsPage from "../../pages/manage-online-checkins-ui/manageCheckInsPage";
import { QuestionToAdd } from "../../../data/models";
import {
  FEELING_PREVIEW_OPTIONS,
  SUPPORT_PREVIEW_CHECKBOXES,
  MAX_CUSTOM_QUESTIONS,
  DEFAULT_FEELING_QUESTION_TEXT,
  DEFAULT_SUPPORT_QUESTION_TEXT,
} from "../../../data/manage-online-checkins-ui/customQuestionConstants";
import { env } from "../../../config/env";
import {
  ADD_QUESTIONS_TITLE,
  CHOOSE_QUESTION_TITLE,
  editQuestionTitle,
  questionPreviewTitle,
  WRITE_OWN_QUESTION_TITLE,
} from "../../../data/manage-online-checkins-ui/pageTitles";
import {
  assertCaseBanner,
  assertManageCheckinsPage,
} from "../../assertions/manage-online-checkins-ui/manageCheckinsAssertions";
import {
  assertRelativeHref,
  MPOP_PATH,
} from "../../assertions/manage-online-checkins-ui/mpopHandoff";
import { offenderUuidFrom, urlPattern } from "../../utils/url";

export default class CustomQuestionsJourney {
  private readonly pages: ManageCheckinsPages;
  private readonly manage: ManageCheckInsJourney;

  constructor(private readonly page: Page) {
    this.manage = new ManageCheckInsJourney(page);
    this.pages = new ManageCheckinsPages(page);
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

  /** Back and Cancel on the "add questions" page both point back into
   *  manage page the practitioner came from. */
  async assertAddQuestionsPageLinks(crn: string): Promise<void> {
    await test.step("Back and Cancel hand off to MPOP", async () => {
      const { manage } = await this.openManageForFutureCheckin(crn);
      await manage.clickChangeQuestions();
      await this.pages.addQuestions.assertOnPage();
      const managePath = MPOP_PATH.manageCheckin(
        crn,
        offenderUuidFrom(this.page.url()),
      );

      // The exact manage page we came from. A prefix of manage/ would also
      // match this page's own URL, which sits under it.
      await assertRelativeHref(
        this.pages.addQuestions.backLink(),
        "Back on the add questions page",
        managePath,
      );
      await assertRelativeHref(
        this.pages.addQuestions.cancelLink(),
        "Cancel on the add question page",
        managePath,
      );
    });
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
    questions: QuestionToAdd[],
    firstName?: string,
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
      true,
    );
  }

  async assertNoCustomQuestions(crn: string): Promise<void> {
    const { manage, nextCheckinDate } =
      await this.openManageForFutureCheckin(crn);
    await this.navigateToAddQuestionsPage(manage, nextCheckinDate, crn);
    await expect(
      this.pages.addQuestions.customQuestionRows(),
      `TEST_MANAGE_CRN ${crn} must start without assigned custom questions`,
    ).toHaveCount(0);
  }

  // for e2e setup: adds and saves custom questions without preview/verify steps that addCustomQuestions covers
  async assignCustomQuestions(
    crn: string,
    questions: QuestionToAdd[],
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
    edits: { from: string; to: string; template?: string }[],
    remove: string,
  ): Promise<string[]> {
    const remainingQuestions = original
      .map((q) => edits.find((e) => e.from === q)?.to ?? q)
      .filter((q) => q !== remove);

    await test.step("Edit and delete configured questions, then save", async () => {
      const addPage = this.pages.addQuestions;
      await this.goToAddQuestionsPage(crn);

      for (const edit of edits) {
        await addPage.clickEditQuestion(edit.from);
        await this.pages.editQuestion.assertOnPage();
        await assertManageCheckinsPage(
          this.page,
          crn,
          edit.template
            ? editQuestionTitle(edit.template)
            : WRITE_OWN_QUESTION_TITLE,
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
      }

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
    questions: QuestionToAdd[],
    crn: string,
  ): Promise<void> {
    for (const question of questions) {
      const { text } = question;
      await this.pages.addQuestions.clickAddQuestion();
      await this.pages.chooseQuestion.assertOnPage();
      await assertManageCheckinsPage(this.page, crn, CHOOSE_QUESTION_TITLE);
      if (!("template" in question)) {
        await this.pages.chooseQuestion.writeOwnQuestion(text);
        await this.pages.addQuestions.assertOnPage();
        await expect(
          this.pages.addQuestions.customQuestionRow(text),
          "A bespoke question gets a question mark added",
        ).toContainText(`${text}?`);
        continue;
      }
      await this.pages.chooseQuestion.selectQuestionByTemplate(
        question.template,
      );
      await this.pages.editQuestion.assertOnPage();
      await assertManageCheckinsPage(
        this.page,
        crn,
        editQuestionTitle(question.template),
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
  private async save(
    crn: string,
    firstName?: string,
    verifyAddedBanner = false,
  ): Promise<void> {
    await this.pages.addQuestions.clickSaveQuestions();
    await expect(
      this.page,
      "Saving questions should land on the manage-online-checkins-ui manage page",
    ).toHaveURL(
      urlPattern(
        env.manageCheckinsUiUrl(),
        `/case/${crn}/appointments/check-in/manage/`,
      ),
    );
    await assertCaseBanner(this.page, crn);
    if (verifyAddedBanner) {
      const questionsAddedBanner = firstName
        ? this.pages.manage.questionsAddedBanner(firstName)
        : this.page.getByText(
            /added additional questions to .+’s next online check in/,
          );
      await expect(
        questionsAddedBanner,
        firstName
          ? `Should confirm questions were added to ${firstName}'s next check in`
          : "Should confirm questions were added to the next online check in",
      ).toBeVisible();
    }
  }

  private async saveAndVerifyQuestions(
    crn: string,
    questions: string[],
    firstName?: string,
    verifyAddedBanner = false,
  ): Promise<void> {
    await test.step("Save and verify the saved questions", async () => {
      await this.save(crn, firstName, verifyAddedBanner);
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
        `Add question button should be disabled once ${MAX_CUSTOM_QUESTIONS} questions exist`,
      ).toBeDisabled();
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
