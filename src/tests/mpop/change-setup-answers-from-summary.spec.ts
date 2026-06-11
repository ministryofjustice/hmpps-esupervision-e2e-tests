import test, { expect } from "@playwright/test";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import { Preference } from "../../support/pages/mpop/contactPreferencePage";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import { PhotoOptions } from "../../support/pages/mpop/photoOptionsPage";
import { firstCheckinDateString } from "../../support/utils/date";
import { env } from "../../config/env";

const crn = env.mpopTestCrn();

test("practitioner changes answers from the summary", async ({ page }) => {
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(crn);

  const summary = await journey.completeSetupToSummary({
    date: firstCheckinDateString(8),
    frequency: FrequencyOptions.EVERY_WEEK,
    preference: Preference.TEXT,
    contact: { mobile: "07771900900" },
    photo: PhotoOptions.UPLOAD,
    eligibilityIds: [9],
  });

  await test.step("Change frequency: Every week -> Every 4 weeks", async () => {
    await journey.changeDateFrequencyFromSummary(summary, {
      frequency: FrequencyOptions.EVERY_4_WEEKS,
    });
    await expect(summary.summaryValueLocator("frequency")).toContainText(
      "Every 4 weeks",
    );
  });

  await test.step("Change contact preference: Text message -> Email", async () => {
    await journey.changeContactPreferenceFromSummary(summary, {
      preference: Preference.EMAIL,
    });
    await expect(
      summary.summaryValueLocator("contactPreference"),
    ).toContainText("Email");
  });
});
