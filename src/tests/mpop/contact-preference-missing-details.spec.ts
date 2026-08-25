import test, { expect } from "@playwright/test";
import DeliusOffenderJourney from "../../support/journeys/ndelius/deliusOffenderJourney";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import { Preference } from "../../support/pages/mpop/contactPreferencePage";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import { PhotoOptions } from "../../support/pages/mpop/photoOptionsPage";
import { firstCheckinDateString } from "../../support/utils/date";
import { TEST_CONTACT } from "../../data/mpop/testData";
import { attachCreatedCrn } from "../../support/utils/createdCrns";

// The mirror of setup-online-checkins.spec.ts, which enters a missing mobile.
// Each direction is its own branch: the preference picks both the field and the
// `change` parameter.
test("practitioner enters a missing email when changing preference to email for an offender with only a mobile number on file", async ({
  page,
}, testInfo) => {
  const offender = await new DeliusOffenderJourney(page).createTestOffender();
  await attachCreatedCrn(testInfo, offender.crn);

  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(offender.crn);

  const summary = await journey.completeSetupToSummary(offender.crn, {
    date: firstCheckinDateString(7),
    frequency: FrequencyOptions.EVERY_WEEK,
    preference: Preference.TEXT,
    contact: { mobile: TEST_CONTACT.mobile },
    photo: PhotoOptions.UPLOAD,
    eligibilityIds: [9],
    rationale: "E2E test rationale",
  });
  await expect(summary.summaryValueLocator("contactPreference")).toContainText(
    "Text message",
  );

  await journey.changeContactPreferenceFromSummary(offender.crn, summary, {
    preference: Preference.EMAIL,
    contact: { email: TEST_CONTACT.email },
  });

  await expect(summary.summaryValueLocator("contactPreference")).toContainText(
    "Email",
  );
  await expect(summary.summaryValueLocator("email")).toContainText(
    TEST_CONTACT.email,
  );
});
