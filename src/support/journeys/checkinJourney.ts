import { test, expect, Page } from "@playwright/test";
import { dobParts } from "../utils/date";
import {
  MentalHealthOption,
  AssistanceSelection,
  CheckInPerson,
  AdditionalAnswer,
} from "../../data/models";
import { env } from "../../config/env";
import { Pages } from "../pages/checkin-ui/Pages";
import { ADDITIONAL_QUESTION_URL } from "../pages/checkin-ui/additionalQuestionPage";

const baseUrl = (): string => env.checkInUrl();

const DEFAULT_ADDITIONAL_ANSWERS = [
  "It's been going well",
  "Yes, all good at home",
  "There's something I would like to discuss",
];

export default class CheckinJourney {
  private readonly pages: Pages;

  constructor(private readonly page: Page) {
    this.pages = new Pages(page);
  }

  async navigateToCheckin(uuid: string): Promise<void> {
    await test.step(`Open check in ${uuid}`, async () => {
      await this.page.goto(`${baseUrl()}/${uuid}`);
      await this.pages.homepage.isOnPage();
      await expect(this.pages.homepage.startButton()).toBeVisible();
    });
  }

  async clickStart(): Promise<void> {
    await this.pages.homepage.clickStart();
  }

  async completePersonalDetails(person: CheckInPerson): Promise<void> {
    await test.step("Complete personal details", async () => {
      await this.pages.personalDetails.isOnPage();
      const { day, month, year } = dobParts(person.dob);
      await this.pages.personalDetails.completeFormAndContinue({
        firstName: person.firstName,
        lastName: person.lastName,
        day,
        month,
        year,
      });
    });
  }

  async completeMentalHealthQuestion(
    option: MentalHealthOption,
  ): Promise<void> {
    await test.step("Answer Mental health question", async () => {
      await this.pages.mentalHealth.isOnPage();
      await expect(
        this.pages.mentalHealth.veryWellRadio(),
        "VERY_WELL radio must be present",
      ).toBeAttached();
      await expect(
        this.pages.mentalHealth.wellRadio(),
        "WELL radio must be present",
      ).toBeAttached();
      await expect(
        this.pages.mentalHealth.okRadio(),
        "OK radio must be present",
      ).toBeAttached();
      await expect(
        this.pages.mentalHealth.notGreatRadio(),
        "NOT_GREAT radio must be present",
      ).toBeAttached();
      await expect(
        this.pages.mentalHealth.strugglingRadio(),
        "STRUGGLING radio must be present",
      ).toBeAttached();
      await this.pages.mentalHealth.selectOptionAndContinue(option);
    });
  }

  async completeAssistanceWithNoHelp(): Promise<void> {
    await this.pages.assistance.isOnPage();
    await this.pages.assistance.selectNoHelpAndContinue();
  }

  async completeAssistanceQuestion(
    selections: AssistanceSelection[],
  ): Promise<void> {
    await test.step(`Answer assistance: ${selections.map((s) => s.option).join(", ")}`, async () => {
      await this.pages.assistance.isOnPage();
      await this.pages.assistance.selectOptionsAndContinue(selections);
    });
  }

  async completeAdditionalQuestions(
    questions: string[],
    answer: string[] = DEFAULT_ADDITIONAL_ANSWERS,
  ): Promise<AdditionalAnswer[]> {
    const answered: AdditionalAnswer[] = [];
    await test.step(`Answer ${questions.length} additional question(s)`, async () => {
      for (let i = 0; i < questions.length; i++) {
        await expect(this.page).toHaveURL(ADDITIONAL_QUESTION_URL);
        await expect(this.pages.additionalQuestion.answerField()).toBeVisible();
        const shown = await this.pages.additionalQuestion.questionText();
        const response = answer[i] ?? `Additional answer ${i + 1}`;
        await this.pages.additionalQuestion.answerAndContinue(response);
        answered.push({
          question: questions.find((q) => shown.includes(q)) ?? shown,
          answer: response,
        });
      }

      for (const question of questions) {
        expect(
          answered.map((a) => a.question),
          `Offender check in should show the added question "${question}"`,
        ).toContain(question);
      }
    });
    return answered;
  }

  async completeLivenessFlow(uuid: string): Promise<void> {
    await this.pages.livenessRecord.clickContinue();
    await this.page.goto(`${baseUrl()}/${uuid}/liveness/view`);
    await expect(this.pages.livenessView.submitAnywayButton()).toBeVisible();
    await this.pages.livenessView.submitAnyway();
    await expect(this.page, "Should reach check-your-answers").toHaveURL(
      /check-your-answers/,
    );
  }

  async completeFallbackVideoNoMatchFlow(uuid: string): Promise<void> {
    await test.step("Record video (NO MATCH) and submit video anyway", async () => {
      await this.page.goto(`${baseUrl()}/${uuid}/liveness/record`);
      // The liveness widget can't run in headless CI, so
      // navigated to an outcome page. I cannot click through UI and
      // navigate to fallback directly
      await this.page.waitForURL(/\/liveness\/outcome\//, { timeout: 30000 });
      await this.page.goto(`${baseUrl()}/${uuid}/liveness/fallback-inform`);
      await this.pages.fallbackInform.isOnPage();
      await this.pages.fallbackInform.clickContinue();
      await expect(
        this.page,
        "Should reach /liveness/fallback-record",
      ).toHaveURL(/\/liveness\/fallback-record/);
      await expect(this.pages.fallbackRecord.startBtn()).toBeEnabled({
        timeout: 10000,
      });
      await this.pages.fallbackRecord.clickStart();

      await expect(
        this.pages.fallbackRecord.reviewVideo(),
        "Review screen must appear after recording",
      ).toBeVisible({ timeout: 60000 });

      await this.pages.fallbackRecord.clickReviewVideoContinue();

      await expect(
        this.pages.fallbackRecord.noMatchScreen(),
        "'We cannot confirm this is you' screen must appear",
      ).toBeVisible({ timeout: 60000 });
      await expect(this.pages.fallbackRecord.noMatchHeading()).toContainText(
        "We cannot confirm this is you",
      );
      await expect(
        this.pages.fallbackRecord.submitVideoAnywayLink(),
      ).toBeVisible();
      await expect(this.pages.fallbackRecord.recordAgainLink()).toBeVisible();
      await this.pages.fallbackRecord.clickSubmitVideoAnyway();
      await expect(this.page).toHaveURL(/check-your-answers/);
    });
  }

  async verifyCheckAnswersPage(): Promise<void> {
    await test.step("Check your answers ", async () => {
      await expect(this.page, "URL must contain check-your-answers").toHaveURL(
        /check-your-answers/,
      );
      await this.pages.checkAnswers.isOnPage();
    });
  }

  async verifySummaryContains(
    key: string,
    expectedValue: string,
  ): Promise<void> {
    await expect(
      this.pages.checkAnswers.getSummaryValue(key),
      `Summary row "${key}" must contain "${expectedValue}"`,
    ).toContainText(expectedValue);
  }

  async verifyAssistanceCommentsInSummary(
    selections: AssistanceSelection[],
  ): Promise<void> {
    for (const { option, comment } of selections) {
      await expect(
        this.page.locator(".govuk-summary-list__value", { hasText: comment }),
        `Assistance comment for ${option} must appear in summary`,
      ).toBeVisible();
    }
  }

  async changeAnswer(summaryKey: string): Promise<void> {
    await this.pages.checkAnswers.clickChangeLink(summaryKey);
  }

  async submitCheckin(): Promise<void> {
    await test.step("Submit check in", async () => {
      await this.pages.checkAnswers.submitCheckin();
    });
  }

  async verifyConfirmationPage(): Promise<void> {
    await expect(this.page, "URL must contain /confirmation").toHaveURL(
      /\/confirmation/,
    );
  }
}
