import test, { expect } from "@playwright/test";
import { env } from "../../config/env";
import ManageCheckInsJourney from "../../support/journeys/mpop/manageCheckinsJourney";
import {
  displayedCheckinDatePattern,
  firstCheckinDateString,
} from "../../support/utils/date";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import { getOffenderByCrn } from "../../api/offender";
import { ensureActiveCheckin } from "../../support/utils/activeCheckin";
import { Preference } from "../../data/models";
import { LEGACY_MPOP } from "../../support/utils/legacyMpop";
import { urlPattern } from "../../support/utils/url";

// Sole owner of TEST_MPOP_STOP_RESTART_CRN. Serial because stop -> INACTIVE is
// the precondition for restart -> VERIFIED, which leaves the CRN as it started.
test.describe.configure({ mode: "serial" });

test.describe("stop then restart online check ins (existing CRN)", () => {
  const crn = env.mpopStopRestartCrn();
  let token: string;

  test.beforeAll(async () => {
    token = await ensureActiveCheckin(crn);
  });

  test("practitioner stops online check ins for a set up offender -> offender becomes INACTIVE", async ({
    page,
  }) => {
    const journey = new ManageCheckInsJourney(page);
    await journey.login();
    await journey.stopCheckIns(crn, "E2E test stop");
    await expect
      .poll(async () => (await getOffenderByCrn(crn, token)).status)
      .toBe("INACTIVE");

    // Opens the stop page for a stopped offender and checks it redirects to MPOP.
    // TODO(legacy-mpop): drop the guard - legacy MPOP renders the page instead.
    if (!LEGACY_MPOP) {
      await test.step("Stop page for a stopped offender redirects to MPOP", async () => {
        const { uuid } = await getOffenderByCrn(crn, token);
        const base = env.manageCheckinsUiUrl().replace(/\/$/, "");
        await page.goto(
          `${base}/case/${crn}/appointments/check-in/manage/${uuid}/stop-checkin`,
        );
        await expect(
          page,
          "Stop page should redirect a stopped offender to their record in MPOP",
        ).toHaveURL(urlPattern(env.mpopUrl(), `/case/${crn}`));
      });
    }
  });

  test("practitioner restarts online check ins for the stopped offender -> offender returns to VERIFIED", async ({
    page,
  }) => {
    const journey = new ManageCheckInsJourney(page);
    await journey.login();
    await journey.restartCheckIns(crn, {
      date: firstCheckinDateString(7),
      frequency: FrequencyOptions.EVERY_8_WEEKS,
      preference: Preference.EMAIL,
    });
    await expect
      .poll(async () => (await getOffenderByCrn(crn, token)).status)
      .toBe("VERIFIED");

    // VERIFIED alone would pass if restart ignored the schedule, so read it back
    // off the manage page - in the display format that page renders.
    const manage = await journey.openManage(crn);
    await expect(
      manage.settingsNextCheckinDate(),
      "Restart should save the first check in date that was entered",
    ).toContainText(displayedCheckinDatePattern(7));
    await expect(
      manage.settingsFrequency(),
      "Restart should save the frequency that was selected",
    ).toContainText("Every 8 weeks");

    // Clicks Back on the manage page and checks it returns to MPOP.
    await journey.returnToOverview(crn);
  });
});
