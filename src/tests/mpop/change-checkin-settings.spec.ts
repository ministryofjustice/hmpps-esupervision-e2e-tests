import test, { expect } from "@playwright/test";
import { NewOffender } from "../../data/delius/types";
import { createCheckinOffender } from "../../support/fixtures/checkinOffender";
import ManageCheckInsJourney from "../../support/journeys/mpop/manageCheckinsJourney";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import {
  displayedCheckinDatePattern,
  firstCheckinDateString,
} from "../../support/utils/date";
import { attachCreatedCrn } from "../../support/utils/createdCrns";

// Owns its offender: this permanently changes the check in schedule.
let offender: NewOffender;

test.beforeAll(async ({ browser }) => {
  offender = await createCheckinOffender(browser);
});

test("practitioner changes the next check in date and frequency from the manage page", async ({
  page,
}, testInfo) => {
  await attachCreatedCrn(testInfo, offender.crn);

  const journey = new ManageCheckInsJourney(page);
  await journey.login();

  await journey.changeCheckInSettings(offender.crn, {
    date: firstCheckinDateString(14),
    frequency: FrequencyOptions.EVERY_4_WEEKS,
  });

  // In the display format the manage page renders, not the d/M/yyyy the input takes.
  // Anchored, so "5 August" cannot match inside "25 August".
  const manage = await journey.openManage(offender.crn);
  await expect(manage.settingsNextCheckinDate()).toContainText(
    displayedCheckinDatePattern(14),
  );
  await expect(manage.settingsFrequency()).toContainText("Every 4 weeks");
});
