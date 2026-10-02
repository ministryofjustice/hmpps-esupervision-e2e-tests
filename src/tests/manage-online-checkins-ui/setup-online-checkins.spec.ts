import test, { expect } from "@playwright/test";
import { env } from "../../config/env";
import SetupOnlineCheckinsJourney from "../../support/journeys/manage-online-checkins-ui/setupOnlineCheckinsJourney";
import { FrequencyOptions } from "../../support/pages/manage-online-checkins-ui/dateFrequencyPage";
import { PhotoOptions } from "../../support/pages/manage-online-checkins-ui/photoOptionsPage";
import { firstCheckinDateString } from "../../support/utils/date";
import {
  TEST_CONTACT,
  UPDATED_CONTACT,
} from "../../data/manage-online-checkins-ui/testData";
import { Preference } from "../../data/models";
import { assertTierCrnPreconditions } from "../../support/assertions/api/supervisionPackageAPI";
import { assertTier } from "../../support/assertions/manage-online-checkins-ui/manageCheckinsAssertions";

// Tests for changing frequency and contact details from the summary page.
// These use existing CRNs since they're testing UI workflows, not setup or eligibility.

test("practitioner changes the next check in date and frequency from the manage page", async ({
  page,
}) => {
  const crn = env.tierCrn("G");
  await assertTierCrnPreconditions(crn, "G");
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(crn);

  const summary = await journey.completeSetupToSummary(crn, {
    date: firstCheckinDateString(7),
    frequency: FrequencyOptions.EVERY_WEEK,
    preference: Preference.EMAIL,
    contact: { email: TEST_CONTACT.email },
    photo: PhotoOptions.UPLOAD,
  });

  await test.step("Summary reflects the answers entered", async () => {
    const firstCheckin = firstCheckinDateString(7);
    await expect(summary.summaryValueLocator("date")).toContainText(
      firstCheckin,
    );
    await expect(summary.summaryValueLocator("frequency")).toContainText(
      "Every week",
    );
  });

  await test.step("Change frequency: Every week -> Every 4 weeks", async () => {
    await journey.changeDateFrequencyFromSummary(summary, {
      frequency: FrequencyOptions.EVERY_4_WEEKS,
    });
    await expect(summary.summaryValueLocator("frequency")).toContainText(
      "Every 4 weeks",
    );
  });
});

test("practitioner changes contact details from the manage page", async ({
  page,
}) => {
  const crn = env.tierCrn("A");
  await assertTierCrnPreconditions(crn, "A");
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(crn);
  await assertTier(page, crn, /Tier:\s*A\b/);

  // Entering the email saves it to the record, which sets up the rest of the test.
  const summary = await journey.completeSetupToSummary(crn, {
    date: firstCheckinDateString(7),
    frequency: FrequencyOptions.EVERY_WEEK,
    preference: Preference.EMAIL,
    contact: { email: TEST_CONTACT.email },
    photo: PhotoOptions.UPLOAD,
  });

  await test.step("Change preference to Text message", async () => {
    await journey.changeContactPreferenceFromSummary(crn, summary, {
      preference: Preference.TEXT,
      contact: { mobile: TEST_CONTACT.mobile },
    });
    await expect(
      summary.summaryValueLocator("contactPreference"),
    ).toContainText("Text message");
    await expect(summary.summaryValueLocator("mobile")).toContainText(
      TEST_CONTACT.mobile,
    );
  });

  await test.step("Change preference back to Email", async () => {
    await journey.changeContactPreferenceFromSummary(crn, summary, {
      preference: Preference.EMAIL,
      contact: { email: UPDATED_CONTACT.email },
    });
    await expect(
      summary.summaryValueLocator("contactPreference"),
    ).toContainText("Email");
    await expect(summary.summaryValueLocator("email")).toContainText(
      UPDATED_CONTACT.email,
    );
  });
});
