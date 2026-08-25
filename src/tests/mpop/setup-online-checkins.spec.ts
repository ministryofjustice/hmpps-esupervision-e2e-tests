import test, { expect } from "@playwright/test";
import DeliusOffenderJourney from "../../support/journeys/ndelius/deliusOffenderJourney";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import { Preference } from "../../support/pages/mpop/contactPreferencePage";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import { PhotoOptions } from "../../support/pages/mpop/photoOptionsPage";
import { firstCheckinDateString } from "../../support/utils/date";
import { TEST_CONTACT, UPDATED_CONTACT } from "../../data/mpop/testData";
import { attachCreatedCrn } from "../../support/utils/createdCrns";

// The contact step asks for the detail when the record has none and offers it
// to confirm when it does. A test covers each route.
//
// Both create their own offender: nothing pins down a long lived CRN's contact
// details, so it would silently decide which route ran.

test("practitioner sets up online check ins and changes answers from the summary", async ({
  page,
}, testInfo) => {
  // A new offender holds no contact details, so this takes the "ask for it" route.
  const offender = await new DeliusOffenderJourney(page).createTestOffender();
  await attachCreatedCrn(testInfo, offender.crn);

  const firstCheckin = firstCheckinDateString(7);
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(offender.crn);

  const summary = await journey.completeSetupToSummary(offender.crn, {
    date: firstCheckin,
    frequency: FrequencyOptions.EVERY_WEEK,
    preference: Preference.EMAIL,
    contact: { mobile: TEST_CONTACT.mobile, email: TEST_CONTACT.email },
    photo: PhotoOptions.UPLOAD,
    eligibilityIds: [9],
    rationale: "E2E test rationale",
  });

  await test.step("Summary reflects the answers entered", async () => {
    await expect(summary.rationaleValueLocator()).toContainText(
      "E2E test rationale",
    );
    await expect(summary.summaryValueLocator("date")).toContainText(
      firstCheckin,
    );
    await expect(summary.summaryValueLocator("frequency")).toContainText(
      "Every week",
    );
    await expect(
      summary.summaryValueLocator("contactPreference"),
    ).toContainText("Email");

    // The new UI lists only the detail matching the preference, so the mobile is
    // asserted after the change to Text message below.
    await expect(summary.summaryValueLocator("email")).toContainText(
      TEST_CONTACT.email,
    );
    await expect(
      summary.summaryValueLocator("photo").locator("img"),
    ).toBeVisible();
  });

  await test.step("Change frequency: Every week -> Every 4 weeks", async () => {
    await journey.changeDateFrequencyFromSummary(summary, {
      frequency: FrequencyOptions.EVERY_4_WEEKS,
    });
    await expect(summary.summaryValueLocator("frequency")).toContainText(
      "Every 4 weeks",
    );
  });

  await test.step("Change contact preference: Email -> Text message", async () => {
    await journey.changeContactPreferenceFromSummary(offender.crn, summary, {
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
});

// TODO(legacy-mpop): passes under LEGACY_MPOP but proves less - MPOP has no
// confirm step.
test("practitioner confirms, then replaces, the contact detail already held", async ({
  page,
}, testInfo) => {
  const offender = await new DeliusOffenderJourney(page).createTestOffender();
  await attachCreatedCrn(testInfo, offender.crn);

  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(offender.crn);

  // Entering the email saves it to the record, which sets up the rest of the test.
  const summary = await journey.completeSetupToSummary(offender.crn, {
    date: firstCheckinDateString(7),
    frequency: FrequencyOptions.EVERY_WEEK,
    preference: Preference.EMAIL,
    contact: { email: TEST_CONTACT.email },
    photo: PhotoOptions.UPLOAD,
    eligibilityIds: [9],
    rationale: "E2E test rationale",
  });

  // No contact passed, so the wizard must offer the saved email to confirm. If it
  // asks for one instead the journey throws, which is the failure we want.
  // assertConfirmValidation also submits it once unanswered to check it refuses.
  await journey.changeContactPreferenceFromSummary(offender.crn, summary, {
    preference: Preference.EMAIL,
    assertConfirmValidation: true,
  });

  expect(
    journey.contactOnFile(),
    "Confirm step should show the email saved during setup",
  ).toBe(TEST_CONTACT.email);

  await expect(summary.summaryValueLocator("email")).toContainText(
    TEST_CONTACT.email,
  );

  // The other answer to the same question: a contact for a detail already on file
  // means replace it. Landing back on the summary proves ?cya=true survived.
  await test.step("Confirm step: No, I need to change the email address", async () => {
    await journey.changeContactPreferenceFromSummary(offender.crn, summary, {
      preference: Preference.EMAIL,
      contact: { email: UPDATED_CONTACT.email },
    });

    await expect(
      summary.summaryValueLocator("email"),
      "Summary should show the replacement email, not the one it offered to confirm",
    ).toContainText(UPDATED_CONTACT.email);
  });
});
