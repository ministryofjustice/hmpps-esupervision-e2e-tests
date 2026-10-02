import test, { expect } from "@playwright/test";
import { env } from "../../config/env";
import ManageCheckInsJourney from "../../support/journeys/manage-online-checkins-ui/manageCheckinsJourney";
import { ManageCheckinsPages } from "../../support/pages/manage-online-checkins-ui/manageCheckinsPages";
import { UPDATED_CONTACT } from "../../data/manage-online-checkins-ui/testData";
import { Preference } from "../../data/models";
import { assertActiveManageCrn } from "../../support/assertions/api/supervisionPackageAPI";

const crn = env.manageCrn();
let restoreEmailAfterTest = false;

test.beforeAll(async () => {
  await assertActiveManageCrn(crn);
});

test.afterEach(async ({ page }) => {
  if (!restoreEmailAfterTest) return;

  await new ManageCheckInsJourney(page).changeContactDetails(crn, {
    preference: Preference.EMAIL,
    contact: { email: UPDATED_CONTACT.email },
  });
});

test("practitioner changes contact details from the manage page", async ({
  page,
}) => {
  const journey = new ManageCheckInsJourney(page);
  await journey.login();
  const pages = new ManageCheckinsPages(page);

  restoreEmailAfterTest = true;
  await journey.changeContactDetails(crn, {
    preference: Preference.TEXT,
    contact: { mobile: UPDATED_CONTACT.mobile },
  });

  // Navigate away and back, so this asserts the record and not the submitted form.
  const manage = await journey.openManage(crn);
  await manage.clickChangeContactDetails();
  await expect(
    pages.contactDetails.mobileNumberValue(),
    "Saved mobile number should be on the record after reloading the page",
  ).toContainText(UPDATED_CONTACT.mobile);
  await expect(pages.contactDetails.textMessageRadio()).toBeChecked();

  await journey.changeContactDetails(crn, {
    preference: Preference.EMAIL,
    contact: { email: UPDATED_CONTACT.email },
  });
  restoreEmailAfterTest = false;

  const manageAgain = await journey.openManage(crn);
  await manageAgain.clickChangeContactDetails();

  await expect(
    pages.contactDetails.emailAddressValue(),
    "Saved email address should be on the record after reloading the page",
  ).toContainText(UPDATED_CONTACT.email);
  await expect(pages.contactDetails.emailRadio()).toBeChecked();
});
