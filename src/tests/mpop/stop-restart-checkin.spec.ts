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
  });
});
