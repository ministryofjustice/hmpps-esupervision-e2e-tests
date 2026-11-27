import { expect, test } from "@playwright/test";
import { getToken } from "../../../api/auth";
import {
  checkEligibility,
  EligibilityAnswers,
  EligibilityCheck,
} from "../../../api/eligibility";
import { setPilotCase } from "../../../api/offender";
import { env } from "../../../config/env";
const NO_ANSWERS_TIER_C: EligibilityAnswers = {
  accreditedProgramme: null,
  deviceRestriction: false,
  youthSentence: null,
};
let pilotPractitioner: Promise<boolean> | undefined;
/**
 * Whether the e2e practitioner has ever had a pilot case (someone in online check ins before
 * 1 October 2026), which decides Tier C, and Tier A/B off an accredited programme. Read from the
 * API's decision for the Tier C CRN, and remembered until requirePilotPractitioner changes it.
 */
export const practitionerHasPilotCase = (): Promise<boolean> => {
  pilotPractitioner ??= (async () => {
    const crn = env.tierCrn("C");
    const check = await checkEligibility(
      crn,
      NO_ANSWERS_TIER_C,
      await getToken(),
    );
    if (
      check.outcome === "ELIGIBLE" &&
      check.ruleCode === "PRACTITIONER_HAS_PILOT_CASE_TIER_C"
    ) {
      return true;
    }
    if (check.outcome === "INELIGIBLE" && check.ruleCode === "IS_TIER_C") {
      return false;
    }
    throw new Error(
      `Tier C CRN ${crn} should be decided by the pilot practitioner rules, but the API said ${JSON.stringify(check)}`,
    );
  })();
  return pilotPractitioner;
};
// Whether a test has changed TEST_MANAGE_CRN's pilot value. It is never a real pilot case, so the
// reset always puts back false: a run killed mid-test can't leave it a pilot case for the next run.
let pilotCaseChanged = false;
/**
 * Makes the e2e practitioner a pilot practitioner, or not, by marking TEST_MANAGE_CRN - an active
 * person of theirs that no test stops or restarts - as a pilot case through the API's dev-only test
 * support. Skips the test when that can't give what it needs: the endpoint isn't deployed (as in
 * test), or - for want = false - another of the practitioner's people is a pilot case. Call
 * resetPilotCase after each test.
 */
export const requirePilotPractitioner = async (
  want: boolean,
): Promise<void> => {
  const crn = env.manageCrn();
  let unavailable = "";
  const pilotCase = await setPilotCase(crn, want, await getToken());
  if (pilotCase) {
    pilotCaseChanged = true;
    pilotPractitioner = undefined;
    if (
      pilotCase.practitionerId.toUpperCase() !==
        env.practitionerName().toUpperCase() ||
      pilotCase.status === "INITIAL"
    ) {
      throw new Error(
        `TEST_MANAGE_CRN ${crn} must belong to the e2e practitioner and be past INITIAL to mark as a pilot case, but is ${pilotCase.practitionerId} and ${pilotCase.status}`,
      );
    }
  } else {
    unavailable = ` (the API couldn't mark ${crn} as a pilot case - the test support endpoint is dev only)`;
  }
  const has = await practitionerHasPilotCase();
  test.skip(
    has !== want,
    want
      ? `Needs the e2e practitioner to have had a pilot case, and they haven't${unavailable}`
      : `Needs the e2e practitioner never to have had a pilot case, and they have${unavailable || " another pilot case"}`,
  );
};
/** Puts TEST_MANAGE_CRN back to not a pilot case, if a test changed it. */
export const resetPilotCase = async (): Promise<void> => {
  if (!pilotCaseChanged) return;
  await setPilotCase(env.manageCrn(), false, await getToken());
  pilotCaseChanged = false;
  pilotPractitioner = undefined;
};
/** Checks the API decides a CRN as a test expects, so a data change fails with the API's reason. */
export const assertEligibility = async (
  crn: string,
  answers: EligibilityAnswers | null,
  expected: Partial<EligibilityCheck>,
): Promise<EligibilityCheck> => {
  const check = await checkEligibility(crn, answers, await getToken());
  expect(
    check,
    `The ESUP API's eligibility check for ${crn} with ${JSON.stringify(answers)}`,
  ).toMatchObject(expected);
  return check;
};
