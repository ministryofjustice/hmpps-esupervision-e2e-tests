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
import { welshHeadings } from "../../data/labels";

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
    await expect(page.locator("html"), "Page must be in Welsh").toHaveAttribute(
      "lang",
      "cy",
    );
    await expect(
      page.getByRole("heading", { level: 1 }),
      "Home page heading must be in Welsh",
    ).toContainText(welshHeadings.home);
  });

  await test.step("Start check in and complete personal details", async () => {
    await pages.homepage.clickPrimaryButton(); // Start now
    await expect(
      page.getByRole("heading", { level: 1 }),
      "Personal details heading must be in Welsh",
    ).toContainText(welshHeadings.personalDetails);
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
    await expect(
      page.getByRole("heading", { level: 1 }),
      "Mental health heading must be in Welsh",
    ).toContainText(welshHeadings.mentalHealth);
    await pages.mentalHealth.selectOption("OK");
    await pages.mentalHealth.clickPrimaryButton(); // Continue

    await expect(
      page.getByRole("heading", { level: 1 }),
      "Assistance heading must be in Welsh",
    ).toContainText(welshHeadings.assistance);
    await pages.assistance.selectNoHelp();
    await pages.assistance.clickPrimaryButton(); // Continue
  });

  await journey.completeFallbackVideoNoMatchFlow(uuid, {
    onFallbackInform: () =>
      expect(
        page.getByRole("heading", { level: 1 }),
        "Fallback inform heading must be in Welsh",
      ).toContainText(welshHeadings.fallbackInform),
    onNoMatchScreen: () =>
      expect(
        page.getByRole("heading", { level: 1 }),
        "No match heading must be in Welsh",
      ).toContainText(welshHeadings.noMatch),
  });

  await test.step("Complete check in", async () => {
    await expect(
      page.getByRole("heading", { level: 1 }),
      "Check answers heading must be in Welsh",
    ).toContainText(welshHeadings.checkAnswers);
    await pages.checkAnswers.confirmCheckbox().check();
    await pages.checkAnswers.clickPrimaryButton(); // Complete check in
    await journey.verifyConfirmationPage();
    await expect(
      page.getByRole("heading", { level: 1 }),
      "Confirmation heading must be in Welsh",
    ).toContainText(welshHeadings.confirmation);
  });
});
