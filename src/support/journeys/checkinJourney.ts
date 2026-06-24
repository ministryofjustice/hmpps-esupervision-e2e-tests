import { test, expect, Page } from "@playwright/test";
import { dobParts } from "../utils/date";
import {
  MentalHealthOption,
  AssistanceSelection,
  CheckInPerson,
} from "../../data/models";
import { env } from "../../config/env";
import { Pages } from "../pages/checkin-ui/Pages";

const baseUrl = (): string => env.checkInUrl();

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

  async completeLivenessFlow(uuid: string): Promise<void> {
    // visit /record first to establish liveness session state; navigating
    // straight to /view otherwise triggers a session error
    await this.page.goto(`${baseUrl()}/${uuid}/liveness/record`);
    await this.page.goto(`${baseUrl()}/${uuid}/liveness/view`);
    await expect(this.pages.livenessView.submitAnywayButton()).toBeVisible();
    await this.pages.livenessView.submitAnyway();
    await expect(this.page, "Should reach check-your-answers").toHaveURL(
      /check-your-answers/,
    );
  }

  async navigateToVideoInform(uuid: string): Promise<void> {
    await this.page.goto(`${baseUrl()}/${uuid}/video/inform`);
    await this.pages.videoInform.isOnPage();
  }

  async startVideoRecording(uuid: string): Promise<void> {
    await this.navigateToVideoInform(uuid);
    await this.pages.videoInform.clickContinue();
    await expect(this.page, "Should reach /video/record").toHaveURL(
      /\/video\/record/,
    );
    await expect(this.pages.videoRecord.startBtn()).toBeEnabled({
      timeout: 10000,
    });
    await this.pages.videoRecord.clickStart();
  }

  async completeVideoRecordNoMatchFlow(uuid: string): Promise<void> {
    await test.step("Record video (NO MATCH) and submit video anyway", async () => {
      await this.navigateToVideoInform(uuid);
      await this.pages.videoInform.clickContinue();
      await expect(this.page, "Should reach /video/record").toHaveURL(
        /\/video\/record/,
      );
      await expect(this.pages.videoRecord.startBtn()).toBeEnabled({
        timeout: 10000,
      });
      await this.pages.videoRecord.clickStart();
      await expect(
        this.pages.videoView.noMatchScreen(),
        "'We cannot confirm this is you' screen must appear",
      ).toBeVisible({ timeout: 60000 });
      await expect(this.pages.videoView.noMatchHeading()).toContainText(
        "We cannot confirm this is you",
      );
      await expect(this.pages.videoView.submitVideoAnywayLink()).toBeVisible();
      await expect(this.pages.videoView.recordAgainLink()).toBeVisible();
      await this.pages.videoView.clickSubmitVideoAnyway();
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
