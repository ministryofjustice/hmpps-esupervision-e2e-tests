import test, { expect } from "@playwright/test";
import { env } from "../../config/env";
import { assertActiveManageCrn } from "../../support/assertions/api/supervisionPackageAPI";
import ManageCheckInsJourney from "../../support/journeys/manage-online-checkins-ui/manageCheckinsJourney";
import { FrequencyOptions } from "../../support/pages/manage-online-checkins-ui/dateFrequencyPage";
import {
  displayedCheckinDatePattern,
  firstCheckinDateString,
} from "../../support/utils/date";

const crn = env.manageCrn();

test.beforeAll(async () => {
  await assertActiveManageCrn(crn);
});

test("practitioner changes the next check in date and frequency from the manage page", async ({
  page,
}) => {
  const journey = new ManageCheckInsJourney(page);
  await journey.login();

  await journey.changeCheckInSettings(crn, {
    date: firstCheckinDateString(14),
    frequency: FrequencyOptions.EVERY_4_WEEKS,
  });

  // In the display format the manage page renders, not the d/M/yyyy the input takes.
  // Anchored, so "5 August" cannot match inside "25 August".
  const manage = await journey.openManage(crn);
  await expect(manage.settingsNextCheckinDate()).toContainText(
    displayedCheckinDatePattern(14),
  );
  await expect(manage.settingsFrequency()).toContainText("Every 4 weeks");
});
