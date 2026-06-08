import { expect, Page } from "@playwright/test";

import { CheckinPages } from "../../pageObjects/checkin-ui";
import { dobParts } from "../../utils/date";
import {
  MentalHealthOption,
  AssistanceSelection,
  CheckInPerson,
} from "../../data/models";
import { log } from "console";

const baseUrl = (): string => {
  if (!process.env.PROBATION_CHECK_IN_URL)
    throw new Error("PROBATION_CHECK_IN_URL not set in env");
  return process.env.PROBATION_CHECK_IN_URL;
};

export default class CheckinJourney {
  private readonly pages: CheckinPages;

  constructor(private readonly page: Page) {
    this.pages = new CheckinPages(page);
  }

  async navigateToCheckin(uuid: string): Promise<void> {
    console.log(`navigateToCheckin: ${uuid}`);
    await this.page.goto(`${baseUrl()}/${uuid}`);
    await this.pages.homepage.isOnPage();
    await expect(
      this.pages.homepage.startButton(),
      "Start button should be visible on index page",
    ).toBeVisible();
    console.log(` Index page loaded`);
  }

  async navigateToLivenessRecord(uuid: string): Promise<void> {
    console.log(
      `navigateToLivenessRecord (LOCAL — requires MOCK_LIVENESS=true)`,
    );
    await this.page.goto(`${baseUrl()}/${uuid}/liveness/record?mock=true`);
    await expect(
      this.pages.livenessRecord.simulateCompleteButton(),
      "Mock buttons not visible — check MOCK_LIVENESS=true is set in UI env",
    ).toBeVisible();
    console.log(`Liveness record page loaded — mock buttons visible`);
  }

  async navigateToLivenessView(uuid: string): Promise<void> {
    console.log(`navigateToLivenessView`);
    await this.page.goto(`${baseUrl()}/${uuid}/liveness/view`);
    await expect(
      this.pages.livenessView.heading(),
      'Liveness view heading must contain "you"',
    ).toContainText("you");
    console.log(` Liveness view page loaded`);
  }

  async navigateToVideoView(uuid: string): Promise<void> {
    console.log(`navigateToVideoView`);
    await this.page.goto(`${baseUrl()}/${uuid}/video/view`);
    await expect(
      this.pages.videoView.heading(),
      'Video view heading must contain "you"',
    ).toContainText("you");
    console.log(`✓ Video view page loaded`);
  }

  async navigateToVideoInform(uuid: string): Promise<void> {
    console.log(`navigateToVideoInform`);
    await this.page.goto(`${baseUrl()}/${uuid}/video/inform`);
    await this.pages.videoInform.isOnPage();
    console.log(`✓ Video inform page loaded`);
  }

  async clickStart(): Promise<void> {
    console.log(`clickStart`);
    await expect(
      this.pages.homepage.startButton(),
      "Start button must be visible before clicking",
    ).toBeVisible();
    await this.pages.homepage.clickStart();
    console.log(`✓ Start clicked`);
  }

  async completePersonalDetails(person: CheckInPerson): Promise<void> {
    console.log(
      `completePersonalDetails: ${person.firstName} ${person.lastName}`,
    );
    await this.pages.personalDetails.isOnPage();
    const { day, month, year } = dobParts(person.dob);
    console.log(day);
    await this.pages.personalDetails.completeFormAndContinue({
      firstName: person.firstName,
      lastName: person.lastName,
      day,
      month,
      year,
    });
    console.log(
      `Personal details submitted — session.submissionAuthorized set`,
    );
  }

  async completeMentalHealthQuestion(
    option: MentalHealthOption,
  ): Promise<void> {
    console.log(`completeMentalHealthQuestion: ${option}`);
    await this.pages.mentalHealth.isOnPage();
    await expect(
      this.pages.mentalHealth.veryWellRadio(),
      "VERY_WELL radio must be present",
    ).toBeVisible();
    await expect(
      this.pages.mentalHealth.WellRadio(),
      "WELL radio must be present",
    ).toBeVisible();
    await expect(
      this.pages.mentalHealth.okRadio(),
      "OK radio must be present",
    ).toBeVisible();
    await expect(
      this.pages.mentalHealth.notGreatRadio(),
      "NOT_GREAT radio must be present",
    ).toBeVisible();
    await expect(
      this.pages.mentalHealth.strugglingRadio(),
      "STRUGGLING radio must be present",
    ).toBeVisible();
    await this.pages.mentalHealth.selectOptionAndContinue(option);
    console.log(`Mental health answered: ${option}`);
  }

  async completeAssistanceWithNoHelp(): Promise<void> {
    console.log(`completeAssistanceWithNoHelp`);
    await this.pages.assistance.isOnPage();
    await this.pages.assistance.selectNoHelpAndContinue();
  }

  async completeAssistanceQuestion(
    selections: AssistanceSelection[],
  ): Promise<void> {
    console.log(
      `completeAssistanceQuestion: ${selections.map((s) => s.option).join(", ")}`,
    );
    await this.pages.assistance.isOnPage();
    await this.pages.assistance.selectOptionsAndContinue(selections);
  }

  async verifyOnInformPage(): Promise<void> {
    await this.pages.livenessInform.isOnPage();
    console.log(`On inform page (h1: "Confirm your identity")`);
  }

  private async resolveVideoResult(): Promise<{
    isMatch: boolean;
    onView: boolean;
  }> {
    const resultHeading = this.page
      .locator("h1")
      .filter({ hasText: /We (have confirmed|cannot confirm) this is you/i })
      .filter({ visible: true });

    await expect(
      resultHeading,
      "A MATCH/NO_MATCH result heading must appear after recording (inline /video/record or /video/view)",
    ).toBeVisible({ timeout: 60000 });

    const text = (await resultHeading.first().textContent()) ?? "";
    const isMatch = /have confirmed/i.test(text);
    const onView = /\/video\/view/.test(this.page.url());
    log(
      `  Rekognition result: ${isMatch ? "MATCH" : "NO_MATCH"} (${onView ? "on /video/view" : "inline /video/record"})`,
    );
    return { isMatch, onView };
  }

  async startVideoRecording(uuid: string): Promise<void> {
    await this.navigateToVideoInform(uuid);
    await this.pages.videoInform.clickContinue();
    await expect(this.page, "Should reach /video/record").toHaveURL(
      /\/video\/record/,
    );
    console.log(`  Waiting for camera...`);
    await expect(
      this.pages.videoRecord.startBtn(),
      "Start must enable when camera ready",
    ).toBeEnabled({ timeout: 10000 });
    await this.pages.videoRecord.clickStart();
  }

  async completeVideoRecordNoMatchFlow(uuid: string): Promise<void> {
    await this.navigateToVideoInform(uuid);
    await this.pages.videoInform.clickContinue();
    await expect(this.page, "Should reach /video/record").toHaveURL(
      /\/video\/record/,
    );

    await expect(this.pages.videoRecord.startBtn()).toBeEnabled({
      timeout: 10_000,
    });
    await this.pages.videoRecord.clickStart();
    console.log(`  Recording...`);
    await expect(
      this.pages.videoRecord.noMatchScreen(),
      "We cannot Confirm this is you screen must appear",
    ).toBeVisible({ timeout: 60000 });

    await expect(this.pages.videoRecord.noMatchHeading()).toContainText(
      "We cannot confirm this is you",
    );
    await expect(
      this.pages.videoRecord.submitVideoAnywayLink(),
      "Submit video anyway must be visible",
    ).toBeVisible();
    await expect(
      this.pages.videoRecord.recordAgainLink(),
      "Record again link must be visible",
    ).toBeVisible();
    await this.pages.videoRecord.clickSubmitAnyway();
    await expect(this.page).toHaveURL(/check-your-answers/);
  }

  async verifyCheckAnswersPage(): Promise<void> {
    console.log(`verifyCheckAnswersPage`);
    await expect(this.page, "URL must contain check-your-answers").toHaveURL(
      /check-your-answers/,
    );
    await this.pages.checkAnswers.isOnPage();
    console.log(`On check answers page`);
  }

  async verifySummaryContains(
    key: string,
    expectedValue: string,
  ): Promise<void> {
    console.log(`verifySummaryContains: "${key}" → "${expectedValue}"`);
    await expect(
      this.pages.checkAnswers.getSummaryValue(key),
      `Summary row "${key}" must contain "${expectedValue}"`,
    ).toContainText(expectedValue);
  }

  async verifyAssistanceCommentsInSummary(
    selections: AssistanceSelection[],
  ): Promise<void> {
    console.log(
      `verifyAssistanceCommentsInSummary: ${selections.length} selection(s)`,
    );
    for (const { option, comment } of selections) {
      await expect(
        this.page.locator(".govuk-summary-list__value", { hasText: comment }),
        `Assistance comment for ${option} must appear in summary`,
      ).toBeVisible();
    }
    console.log(` All ${selections.length} assistance comment(s) in summary`);
  }

  async changeAnswer(summaryKey: string): Promise<void> {
    console.log(`changeAnswer: "${summaryKey}"`);
    await this.pages.checkAnswers.clickChangeLink(summaryKey);
    console.log(`Change link clicked`);
  }

    async submitCheckin(): Promise<void> {
    await this.pages.checkAnswers.submitCheckin()
  }

    async verifyConfirmationPage(): Promise<void> {
    await expect(this.page, 'URL must contain /confirmation').toHaveURL(/\/confirmation/)
  }
}
