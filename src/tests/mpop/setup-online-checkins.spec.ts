import test from "playwright/test";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import { Preference } from "../../support/pages/mpop/contactPreferencePage";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import { PhotoOptions } from "../../support/pages/mpop/photoOptionsPage";
import { firstCheckinDateString } from "../../support/utils/date";
import { env } from "../../config/env";

const crn = env.mpopTestCrn();

test("practitioner sets up onlie check ins for an offender", async ({
  page,
}) => {
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(crn);
  console.log(firstCheckinDateString(7));
  await journey.completeSetupToSummary({
    date: firstCheckinDateString(7),
    frequency: FrequencyOptions.EVERY_WEEK,
    preference: Preference.EMAIL,
    contact: { email: "test@example.com" },
    photo: PhotoOptions.UPLOAD,
    eligibilityIds: [9],
  });
});
