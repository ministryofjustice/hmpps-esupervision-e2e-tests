import test, { expect } from "@playwright/test";
import ManageCheckInsJourney from "../../support/journeys/mpop/manageCheckinsJourney";
import { Preference } from "../../support/pages/mpop/contactPreferencePage";
import { ManageCheckinsUiPages } from "../../support/pages/manage-checkins-ui/manageCheckinsUiPages";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import {
  ensureMpopLogin,
  getSharedNewUiCheckinOffender,
} from "../../support/utils/sharedActiveCheckinOffender";
import { TEST_CONTACT } from "../../data/mpop/testData";

test("practitioner changes contact details from the manage page on new UI", async ({
  page,
}, testInfo) => {
  const offender = await getSharedNewUiCheckinOffender(page);
  await attachCreatedCrn(testInfo, offender.crn);

  await ensureMpopLogin(page);
  const journey = new ManageCheckInsJourney(page);
  await journey.changeContactDetails(offender.crn, {
    preference: Preference.TEXT,
    contact: { mobile: TEST_CONTACT.mobile },
    expectedUi: "newUi",
  });

  // Re-open the change contact details page and confirm the new preference persisted
  const manage = await journey.openManage(offender.crn);
  await manage.clickChangeContactDetails();
  const pages = new ManageCheckinsUiPages(page);
  await expect(pages.contactDetails.textMessageRadio()).toBeChecked();
});
