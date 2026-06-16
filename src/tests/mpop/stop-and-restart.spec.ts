import test, { expect } from "@playwright/test";
import { env } from "../../config/env";
import { getToken } from "../../api/auth";
import ManageCheckInsJourney from "../../support/journeys/mpop/manageCheckinsJourney";

import {
  firstCheckinDateString,
  isoDateString,
  today,
} from "../../support/utils/date";
import { Preference } from "../../support/pages/mpop/contactPreferencePage";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import { getOffenderByCrn, reactivateOffender } from "../../api/offender";

/* 
stop then restart online check ins (MPOP UI) for an already setup offender
Serial: stop->INACTIVE, restart->verified, so the CRN ends as it started and stays reusable.
Uses its own MPOP_STOP_RESTART_CRN */

test.describe.serial("stop then restart online checkin (existing CRN)", () => {
  const crn = env.mpopStopRestartCrn();
  let token: string;

  //   start from VERIFIED: reactivate only if a prior run left it inactive
  test.beforeAll(async () => {
    token = await getToken();
    const offender = await getOffenderByCrn(crn, token);
    if (offender?.status === "INACTIVE" && offender.uuid) {
      await reactivateOffender(offender.uuid, token, {
        firstCheckin: isoDateString(today.plus({ days: 7 })),
        checkinInterval: "WEEKLY",
        contactPreference: "EMAIL",
      });
    }
  });

  test("practitioner stops online check ins for a set up offender -> offender becomes INACTIVE", async ({
    page,
  }) => {
    const journey = new ManageCheckInsJourney(page);
    await journey.login();
    await journey.stopCheckIns(crn, "E2E test stop");
    await expect
      .poll(async () => (await getOffenderByCrn(crn, token))?.status)
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
      .poll(async () => (await getOffenderByCrn(crn, token))?.status)
      .toBe("VERIFIED");
  });
});
