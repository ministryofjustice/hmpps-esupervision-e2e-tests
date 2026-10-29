import test, { expect } from "@playwright/test";
import { getToken } from "../../api/auth";
import { getOffenderByCrn, deactivateOffender } from "../../api/offender";
import { env } from "../../config/env";
import { assertPackageEligibility } from "../../support/assertions/api/supervisionPackageAPI";
import ManageCheckInsJourney from "../../support/journeys/manage-online-checkins-ui/manageCheckinsJourney";
import { FrequencyOptions } from "../../support/pages/manage-online-checkins-ui/checkInFrequencyPage";
import {
  displayedCheckinDatePattern,
  firstCheckinDateString,
} from "../../support/utils/date";
import { Preference } from "../../data/models";

test.describe("restart online check ins through the accredited programme route ( existing CRN)", () => {
  const crn = env.restartAccreditedCrn();
  let token: string;

  test.beforeAll(async () => {
    await assertPackageEligibility(crn, {
      onSupervisionPackage: true,
      inFinalThird: false,
      inEarlyEngagement: false,
    });

    token = await getToken();
    const { uuid, status } = await getOffenderByCrn(crn, token);
    if (status !== "INACTIVE") {
      await deactivateOffender(uuid, token, "E2E restart accredited programme");
    }

    await expect
      .poll(async () => (await getOffenderByCrn(crn, token)).status)
      .toBe("INACTIVE");
  });

  test("practitioner restarts a Tier A/B accredited programme case -> offender returns to VERIFIED", async ({
    page,
  }) => {
    const journey = new ManageCheckInsJourney(page);
    await journey.login();
    await journey.restartCheckIns(crn, {
      eligibilityAnswers: ["accreditedProgramme"],
      date: firstCheckinDateString(7),
      frequency: FrequencyOptions.EVERY_4_WEEKS,
      preference: Preference.EMAIL,
    });

    await expect
      .poll(async () => (await getOffenderByCrn(crn, token)).status)
      .toBe("VERIFIED");
    const manage = await journey.openManage(crn);
    await expect(manage.settingsNextCheckinDate()).toContainText(
      displayedCheckinDatePattern(7),
    );
    await expect(manage.settingsFrequency()).toContainText("Every 4 weeks");
  });
});
