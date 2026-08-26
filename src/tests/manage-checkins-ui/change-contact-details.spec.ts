import test, { expect } from "@playwright/test";
import { NewOffender } from "../../data/delius/types";
import { createCheckinOffender } from "../../support/fixtures/checkinOffender";
import ManageCheckInsJourney from "../../support/journeys/mpop/manageCheckinsJourney";
import { ManageCheckinsUiPages } from "../../support/pages/manage-checkins-ui/manageCheckinsUiPages";
import { UPDATED_CONTACT } from "../../data/mpop/testData";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import { LEGACY_MPOP } from "../../support/utils/legacyMpop";
import { Preference } from "../../data/models";

// Owns its offender: this permanently changes the contact preference.
let offender: NewOffender;

test.beforeAll(async ({ browser }) => {
  // The only test here is MOCI only, so don't create an offender for a skip.
  // TODO(legacy-mpop): Delete this guard when legacy MPOP is removed.
  if (LEGACY_MPOP) return;
  offender = await createCheckinOffender(browser);
});

test("practitioner changes contact details from the manage page", async ({
  page,
}, testInfo) => {
  // TODO(legacy-mpop): Delete this skip when legacy MPOP is removed - the test
  // then always runs.
  test.skip(
    LEGACY_MPOP,
    "MOCI only: MPOP has no manage-page change contact details flow",
  );

  await attachCreatedCrn(testInfo, offender.crn);

  const journey = new ManageCheckInsJourney(page);
  await journey.login();

  // MOCI's setup only captures the preferred channel, so this offender has no
  // mobile at all. A mobile on the record afterwards can only have come from this
  // save - it cannot pass on a pre-existing value.
  await journey.changeContactDetails(offender.crn, {
    preference: Preference.TEXT,
    contact: { mobile: UPDATED_CONTACT.mobile },
  });

  // Navigate away and back, so this asserts the record and not the submitted form.
  const manage = await journey.openManage(offender.crn);
  await manage.clickChangeContactDetails();
  const pages = new ManageCheckinsUiPages(page);

  await expect(
    pages.contactDetails.mobileNumberValue(),
    "Saved mobile number should be on the record after reloading the page",
  ).toContainText(UPDATED_CONTACT.mobile);
  await expect(pages.contactDetails.textMessageRadio()).toBeChecked();

  await journey.changeContactDetails(offender.crn, {
    preference: Preference.EMAIL,
    contact: { email: UPDATED_CONTACT.email },
  });

  const manageAgain = await journey.openManage(offender.crn);
  await manageAgain.clickChangeContactDetails();

  await expect(
    pages.contactDetails.emailAddressValue(),
    "Saved email address should be on the record after reloading the page",
  ).toContainText(UPDATED_CONTACT.email);
  await expect(pages.contactDetails.emailRadio()).toBeChecked();
});
