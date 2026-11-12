import test, { expect } from "@playwright/test";
import { env } from "../../config/env";
import { getToken } from "../../api/auth";
import { getCheckin } from "../../api/checkin";
import ManageCheckInsJourney from "../../support/journeys/manage-online-checkins-ui/manageCheckinsJourney";
import { ManageCheckinsPages } from "../../support/pages/manage-online-checkins-ui/manageCheckinsPages";
import OverviewPage from "../../support/pages/mpop/overviewPage";
import { Pages as CheckinPages } from "../../support/pages/checkins-ui/Pages";
import { assertActiveManageCrn } from "../../support/assertions/api/supervisionPackageAPI";
import {
  cancelCheckinDueToday,
  ensureCheckinDueToday,
} from "../../support/utils/activeCheckin";

// Uses TEST_ADHOC_CRN: ad hoc, nothing booked. Future check ins (ESUP-2223) off,
// so only an open check in (link sent) can be cancelled. The test opens one for
// today and cancels it; afterAll cancels it through the API if the test failed
// first, so the ad hoc validation test still finds nothing booked.
test.describe("cancel an open check in (existing CRN)", () => {
  const crn = env.adhocCrn();
  let token: string;
  let checkinUuid: string;

  test.beforeAll(async () => {
    await assertActiveManageCrn(crn);
    token = await getToken();
    checkinUuid = await ensureCheckinDueToday(crn, token);
  });

  test.afterAll(async () => {
    await cancelCheckinDueToday(crn, await getToken());
  });

  test("practitioner cancels an open check in -> nothing booked, person told it is cancelled", async ({
    page,
  }) => {
    const journey = new ManageCheckInsJourney(page);
    const pages = new ManageCheckinsPages(page);
    await journey.login();

    await test.step("Blank form is refused", async () => {
      await journey.openCancelCheckIn(crn);
      await pages.cancelCheckin.clickContinue();
      await expect(
        pages.cancelCheckin.fieldError("Enter reason for cancelling"),
        "A reason is required to cancel",
      ).toBeVisible();
      expect((await getCheckin(checkinUuid, token)).status).toBe("CREATED");
    });

    await journey.cancelCheckIn(crn, "E2E cancel - regression");

    await test.step("Success banner and check in cancelled", async () => {
      await expect(pages.manage.successBanner()).toContainText(
        "Upcoming online check in cancelled.",
      );
      const checkin = await getCheckin(checkinUuid, token);
      expect(checkin.status, "Check in should be cancelled").toBe("CANCELLED");
      expect(checkin.sensitive, "Reason was marked sensitive").toBe(true);
    });

    await test.step("Nothing booked afterwards", async () => {
      const manage = await journey.openManage(crn);
      await expect(
        manage.settingsNextCheckinDate(),
        "Nothing is booked after cancelling an ad hoc check in",
      ).toHaveCount(0);
      await expect(manage.scheduleCheckInButton()).toBeVisible();
      await expect(manage.cancelCheckInLink()).toHaveCount(0);
      const overview = new OverviewPage(page);
      await overview.goTo(crn);
      await overview.assertOnPage();
      await expect(overview.nextCheckinValue()).toHaveText(
        "No online check in scheduled",
      );
    });

    await test.step("Person sees the check in has been cancelled", async () => {
      const checkinPages = new CheckinPages(page);
      await page.goto(`${env.checkInUrl()}/${checkinUuid}`);
      await expect(
        checkinPages.cancelled.mainHeading(),
        "Person should land on the cancelled page",
      ).toHaveText(checkinPages.cancelled.heading);
      await expect(checkinPages.cancelled.intro()).toBeVisible();
      await expect(checkinPages.homepage.startButton()).toHaveCount(0);
    });
  });
});
