import { expect, test } from "@playwright/test";
import { getToken } from "../../api/auth";
import {
  createEsupervisionCheckin,
  getCheckin,
  listOffenderCheckins,
} from "../../api/checkin";
import { getOffenderByCrn } from "../../api/offender";
import { env } from "../../config/env";
import ManageCheckInsJourney from "../../support/journeys/manage-online-checkins-ui/manageCheckinsJourney";
import { ManageCheckinsPages } from "../../support/pages/manage-online-checkins-ui/manageCheckinsPages";
import { Pages as CheckinPages } from "../../support/pages/checkins-ui/Pages";
import { dueDateString, today } from "../../support/utils/date";

// TEST_CANCEL_CRN: ad hoc, nothing booked, VERIFIED. Future check ins (ESUP-2223) off.
// Opens a check in due today and cancels it, so the CRN ends with nothing booked again.

test("cancel an open check in", async ({ page }) => {
  const crn = env.adhocCrn();
  const token = await getToken();
  const offender = await getOffenderByCrn(crn, token);
  expect(offender.status, `${crn} must have active check ins`).toBe("VERIFIED");

  // Reuse today's open check in if a failed run left one, otherwise create it
  const open = await listOffenderCheckins(
    env.practitionerName(),
    offender.uuid,
    token,
    "AWAITING_CHECKIN",
  );
  const uuid =
    open.find((c) => c.dueDate === today.toISODate())?.uuid ??
    (await createEsupervisionCheckin(crn, dueDateString(today), token));

  const journey = new ManageCheckInsJourney(page);
  const pages = new ManageCheckinsPages(page);
  await journey.login();

  // Open check in offers Cancel
  let manage = await journey.openManage(crn);
  await manage.cancelCheckInLink().click();
  await pages.cancelCheckin.assertOnPage();

  // Blank form is refused
  await pages.cancelCheckin.clickContinue();
  await expect(
    pages.cancelCheckin.fieldError("Enter reason for cancelling"),
  ).toBeVisible();

  // Cancel
  await pages.cancelCheckin.completePage("E2E cancel - regression");
  await pages.manage.assertOnPage();
  await expect(pages.manage.successBanner()).toContainText(
    "Upcoming online check in cancelled.",
  );
  const checkin = await getCheckin(uuid, token);
  expect(checkin.status).toBe("CANCELLED");
  expect(checkin.sensitive).toBe(true);

  // Nothing booked afterwards
  manage = await journey.openManage(crn);
  await expect(manage.nextCheckinDate()).toHaveText(
    "No online check in scheduled",
  );
  await expect(manage.cancelCheckInLink()).toHaveCount(0);

  // Person can no longer start it
  await page.goto(`${env.checkInUrl()}/${uuid}`);
  await expect(new CheckinPages(page).homepage.startButton()).toHaveCount(0);
});
