import { test, expect } from "@playwright/test";
import CheckinJourney from "../../support/journeys/checkinJourney";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import { getToken } from "../../api/auth";
import { createEsupervisionCheckin } from "../../api/checkin";
import {
  dueDateString,
  today,
  firstCheckinDateString,
  dobParts,
} from "../../support/utils/date";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import { env } from "../../config/env";
import { Pages } from "../../support/pages/checkin-ui/Pages";

test("Complete a full check in with the UI set to Welsh (Cymraeg)", async ({
  page,
}, testInfo) => {
  const onlineCheckin = new OnlineCheckinJourney(page);
  const offender = await onlineCheckin.createOffenderAndSetupCheckins(
    firstCheckinDateString(0),
  );
  await attachCreatedCrn(testInfo, offender.crn);

  const token = await getToken();
  const uuid = await createEsupervisionCheckin(
    offender.crn,
    dueDateString(today),
    token,
  );

  const pages = new Pages(page);
  const journey = new CheckinJourney(page);

  await test.step("Switch to Welsh", async () => {
    await page.goto(`${env.checkInUrl()}/${uuid}`);
    await pages.homepage.switchToWelsh();
    await pages.homepage.assertLanguage("cy");
  });

  await test.step("Start check in and complete personal details", async () => {
    await pages.homepage.clickPrimaryButton(); // Start now
    const { day, month, year } = dobParts(offender.person.dob);
    await pages.personalDetails.completeForm({
      firstName: offender.person.firstName,
      lastName: offender.person.lastName,
      day,
      month,
      year,
    });
    await pages.personalDetails.clickPrimaryButton(); // Continue
  });

  await test.step("Answer mental health and assistance questions", async () => {
    await pages.mentalHealth.selectOption("OK");
    await pages.mentalHealth.clickPrimaryButton(); // Continue

    await pages.assistance.selectNoHelp();
    await pages.assistance.clickPrimaryButton(); // Continue
  });

  await test.step("Complete video fallback flow (no match, submit anyway)", async () => {
    await page.goto(`${env.checkInUrl()}/${uuid}/liveness/record`);
    await page.waitForURL(/\/liveness\/outcome\//, { timeout: 30000 });
    await page.goto(`${env.checkInUrl()}/${uuid}/liveness/fallback-inform`);
    await pages.fallbackInform.clickPrimaryButton(); // Continue
    await expect(page, "Should reach /liveness/fallback-record").toHaveURL(
      /\/liveness\/fallback-record/,
    );

    await expect(pages.fallbackRecord.startBtn()).toBeEnabled({
      timeout: 10000,
    });
    await pages.fallbackRecord.clickStart();

    await expect(
      pages.fallbackRecord.reviewVideo(),
      "Review screen must appear after recording",
    ).toBeVisible({ timeout: 60000 });
    await pages.fallbackRecord.clickReviewVideoContinue();

    await expect(
      pages.fallbackRecord.noMatchScreen(),
      "'We cannot confirm this is you' screen must appear",
    ).toBeVisible({ timeout: 60000 });
    await pages.fallbackRecord.clickSecondaryAction(); // Submit video anyway
    await expect(page, "URL must contain check-your-answers").toHaveURL(
      /check-your-answers/,
    );
  });

  await test.step("Complete check in", async () => {
    await pages.checkAnswers.confirmCheckbox().check();
    await pages.checkAnswers.clickPrimaryButton(); // Complete check in
    await journey.verifyConfirmationPage();
  });
});
