import test, { expect } from "@playwright/test";
import DeliusOffenderJourney from "../../support/journeys/ndelius/deliusOffenderJourney";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import { PhotoOptions } from "../../support/pages/mpop/photoOptionsPage";
import { firstCheckinDateString } from "../../support/utils/date";
import { TEST_CONTACT, UPDATED_CONTACT } from "../../data/mpop/testData";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import { LEGACY_MPOP } from "../../support/utils/legacyMpop";
import { Preference } from "../../data/models";

// The contact step asks for the detail when the record has none and offers it
// to confirm when it does. A test covers each route.
//
// Both create their own offender: nothing pins down a long lived CRN's contact
// details, so it would silently decide which route ran.

test("practitioner sets up online check ins by entering a missing contact detail, then changes frequency and contact preference from the summary", async ({
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
    // TODO(legacy-mpop): Drop the mobile when legacy MPOP is removed. MPOP saves
    // both details inline; MOCI can hold both too, but in its setup summary it
    // shows only the preferred contact, so the mobile here is unused on that path.
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

  await test.step("Change preference to Text message: mobile not on file, so it asks for one", async () => {
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

  // The other direction. Passing only an email is what makes MPOP use its
  // emailAddressAction rather than mobileNumberAction; in MOCI the email is
  // already on file by now, so this answers "No" on the confirm step instead.
  await test.step("Change preference back to Email: email already on file, so it replaces it", async () => {
    await journey.changeContactPreferenceFromSummary(offender.crn, summary, {
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

  await test.step("Change photo: uploaded -> taken", async () => {
    await journey.changePhotoFromSummary(summary, PhotoOptions.TAKE);
    await expect(
      summary.summaryValueLocator("photo").locator("img"),
    ).toBeVisible();
  });
});

test("practitioner confirms, then replaces, the contact detail already held", async ({
  page,
}, testInfo) => {
  // TODO(legacy-mpop): Delete this skip when legacy MPOP is removed - the test
  // then always runs.
  test.skip(LEGACY_MPOP, "MOCI only: MPOP has no confirm contact step");

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

  await test.step("Confirm step: Yes, this is correct - keeps the email already on file", async () => {
    // No contact passed, so the wizard must offer the saved email to confirm. If
    // it asks for one instead the journey throws, which is the failure we want.
    await journey.changeContactPreferenceFromSummary(offender.crn, summary, {
      preference: Preference.EMAIL,
    });

    expect(
      journey.contactOnFile(),
      "Confirm step should show the email saved during setup",
    ).toBe(TEST_CONTACT.email);

    await expect(summary.summaryValueLocator("email")).toContainText(
      TEST_CONTACT.email,
    );
  });

  // Landing back on the summary proves ?cya=true survived.
  await test.step("Confirm step: No, I need to change the email address - replaces it with a new one", async () => {
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
