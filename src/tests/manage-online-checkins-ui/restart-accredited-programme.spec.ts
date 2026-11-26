import test, { expect } from "@playwright/test";
import { getToken } from "../../api/auth";
import { getOffenderByCrn, deactivateOffender } from "../../api/offender";
import { env } from "../../config/env";
import {
  assertPackageEligibility,
  assertTierHeader,
} from "../../support/assertions/api/supervisionPackageAPI";
import ManageCheckInsJourney from "../../support/journeys/manage-online-checkins-ui/manageCheckinsJourney";
import { FrequencyOptions } from "../../support/pages/manage-online-checkins-ui/checkInFrequencyPage";
import {
  displayedCheckinDatePattern,
  firstCheckinDateString,
} from "../../support/utils/date";
import { Preference } from "../../data/models";
import {
  ACCREDITED_PROGRAMME_RULE,
  checkEligibility,
} from "../../api/eligibility";

test.describe("restart online check ins through the accredited programme route (existing CRN)", () => {
  let crn: string;
  let token: string;

  test.beforeAll(async () => {
    crn = env.restartAccreditedCrn();
    await assertTierHeader(crn, /^[AB]/i);

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
    if (env.eligibilityEndpoint()) {
      // A person in the pilot (in online check ins before 1 October 2026) is eligible before the
      // programme rules, so restarts the standard way and doesn't test this route
      const check = await checkEligibility(
        crn,
        {
          accreditedProgramme: true,
          deviceRestriction: false,
          youthSentence: false,
        },
        token,
      );
      test.skip(
        check.ruleCode === "IS_PILOT_USER",
        `${crn} is a pilot person, so the ESUP API makes them eligible without the accredited programme route`,
      );
      expect(
        check,
        `The ESUP API's eligibility check for ${crn}`,
      ).toMatchObject({
        outcome: "ELIGIBLE",
        ruleCode: ACCREDITED_PROGRAMME_RULE,
      });
    }
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
