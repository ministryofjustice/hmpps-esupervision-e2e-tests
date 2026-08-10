import { test } from "@playwright/test";
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
    await journey.verifyPageLanguage("cy");
    await journey.verifyHeadingContainsText(
      welshHeadings.home,
      "Home page heading must be in Welsh",
    );
  });

  await test.step("Start check in and complete personal details", async () => {
    await pages.homepage.clickPrimaryButton(); // Start now
    await journey.verifyHeadingContainsText(
      welshHeadings.personalDetails,
      "Personal details heading must be in Welsh",
    );
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
    await journey.verifyHeadingContainsText(
      welshHeadings.mentalHealth,
      "Mental health heading must be in Welsh",
    );
    await pages.mentalHealth.selectOption("OK");
    await pages.mentalHealth.clickPrimaryButton(); // Continue

    await journey.verifyHeadingContainsText(
      welshHeadings.assistance,
      "Assistance heading must be in Welsh",
    );
    await pages.assistance.selectNoHelp();
    await pages.assistance.clickPrimaryButton(); // Continue
  });

  await journey.completeFallbackVideoNoMatchFlow(uuid, {
    onFallbackInform: () =>
      journey.verifyHeadingContainsText(
        welshHeadings.fallbackInform,
        "Fallback inform heading must be in Welsh",
      ),
    onNoMatchScreen: () =>
      journey.verifyHeadingContainsText(
        welshHeadings.noMatch,
        "No match heading must be in Welsh",
      ),
  });

  await test.step("Complete check in", async () => {
    await journey.verifyHeadingContainsText(
      welshHeadings.checkAnswers,
      "Check answers heading must be in Welsh",
    );
    await pages.checkAnswers.confirmCheckbox().check();
    await pages.checkAnswers.clickPrimaryButton(); // Complete check in
    await journey.verifyConfirmationPage();
    await journey.verifyHeadingContainsText(
      welshHeadings.confirmation,
      "Confirmation heading must be in Welsh",
    );
  });
});
