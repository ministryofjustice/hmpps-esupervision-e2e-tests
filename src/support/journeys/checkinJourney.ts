import { test, expect, Locator, Page } from "@playwright/test";
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
import type CheckinBasePage from "../pages/base/checkinBasePage";

const baseUrl = (): string => env.checkInUrl();

export default class CheckinJourney {
  private readonly pages: Pages;

  constructor(private readonly page: Page) {
    this.pages = new Pages(page);
  }

  private async assertOnPage(page: CheckinBasePage): Promise<void> {
    await expect(page.mainHeading()).toContainText(page.heading);
  }

  async navigateToCheckin(uuid: string): Promise<void> {
    await test.step(`Open check in ${uuid}`, async () => {
      await this.page.goto(`${baseUrl()}/${uuid}`);
      await this.assertOnPage(this.pages.homepage);
      await expect(this.pages.homepage.startButton()).toBeVisible();
    });
  }

  async clickStart(): Promise<void> {
    await this.pages.homepage.clickStart();
  }

  async completePersonalDetails(person: CheckInPerson): Promise<void> {
    await test.step("Complete personal details", async () => {
      await this.assertOnPage(this.pages.personalDetails);
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
      await this.assertOnPage(this.pages.mentalHealth);
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
    await this.assertOnPage(this.pages.assistance);
    await this.pages.assistance.selectNoHelpAndContinue();
  }

  async completeAssistanceQuestion(
    selections: AssistanceSelection[],
  ): Promise<void> {
    await test.step(`Answer assistance: ${selections.map((s) => s.option).join(", ")}`, async () => {
      await this.assertOnPage(this.pages.assistance);
      await this.pages.assistance.selectOptionsAndContinue(selections);
    });
  }

  async completeAdditionalQuestions(
    questions: string[],
    answers: string[] = [],
  ): Promise<AdditionalAnswer[]> {
    const answered: AdditionalAnswer[] = [];
    await test.step(`Answer ${questions.length} additional question(s)`, async () => {
      for (let i = 0; i < questions.length; i++) {
        await expect(this.page).toHaveURL(ADDITIONAL_QUESTION_URL);
        await expect(this.pages.additionalQuestion.answerField()).toBeVisible();
        const expectedQuestion = questions[i];
        const heading = await this.pages.additionalQuestion.questionText();
        expect(
          heading,
          `Additional question ${i + 1} should be displayed in the expected order`,
        ).toContain(expectedQuestion);
        const response = answers[i] ?? `Additional answer ${i + 1}`;
        await this.pages.additionalQuestion.answerAndContinue(response);
        answered.push({
          question: heading,
          answer: response,
        });
      }
    });
    return answered;
  }

  async verifyAdditionalAnswersInSummary(
    additional: AdditionalAnswer[],
  ): Promise<void> {
    if (additional.length === 0) return;
    await test.step("Verify additional answers on check your answers", async () => {
      for (const { question, answer } of additional) {
        await this.verifySummaryContains(question, answer);
      }
    });
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

  async goToFallbackInform(uuid: string): Promise<void> {
    await test.step("Reach fallback-inform page", async () => {
      await this.page.goto(`${baseUrl()}/${uuid}/liveness/record`);
      // The liveness widget can't run in headless CI, so
      // navigated to an outcome page. I cannot click through UI and
      // navigate to fallback directly
      await this.page.waitForURL(/\/liveness\/outcome\//, { timeout: 30000 });
      await this.page.goto(`${baseUrl()}/${uuid}/liveness/fallback-inform`);
    });
  }

  async recordFallbackVideoNoMatch(): Promise<void> {
    await test.step("Record fallback video and reach no-match screen", async () => {
      await this.pages.fallbackInform.clickPrimaryButton();
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
    });
  }

  async submitFallbackVideoAnyway(): Promise<void> {
    await test.step("Submit video anyway", async () => {
      await expect(this.pages.fallbackRecord.recordAgainLink()).toBeVisible();
      await expect(
        this.pages.fallbackRecord.secondaryActionLink(),
      ).toBeVisible();
      await this.pages.fallbackRecord.clickSecondaryAction();
      await expect(this.page, "URL must contain check-your-answers").toHaveURL(
        /check-your-answers/,
      );
    });
  }

  async verifyCheckAnswersPage(): Promise<void> {
    await test.step("Check your answers ", async () => {
      await expect(this.page, "URL must contain check-your-answers").toHaveURL(
        /check-your-answers/,
      );
      await this.assertOnPage(this.pages.checkAnswers);
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

  async verifyPageLanguage(lang: string): Promise<void> {
    await expect(
      this.page.locator("html"),
      `Page language must be "${lang}"`,
    ).toHaveAttribute("lang", lang);
  }

  async verifyHeadingContainsText(
    heading: Locator,
    expected: string,
    message: string,
  ): Promise<void> {
    await expect(heading, message).toContainText(expected);
  }
}
