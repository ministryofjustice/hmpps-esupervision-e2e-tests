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

let pilotCaseMarked = false;

/**
 * Makes the e2e practitioner a pilot practitioner, or not, by marking TEST_PILOT_CASE_CRN as a
 * pilot case through the API's dev-only test support. Skips the test when that can't give what it
 * needs: no TEST_PILOT_CASE_CRN, the endpoint not deployed, or - for want = false - another of
 * the practitioner's cases in dev being a pilot case. Call resetPilotCase after each test.
 */
export const requirePilotPractitioner = async (
  want: boolean,
): Promise<void> => {
  const crn = env.pilotCaseCrn();
  let unavailable = "set TEST_PILOT_CASE_CRN to choose";
  if (crn) {
    const pilotCase = await setPilotCase(crn, want, await getToken());
    if (pilotCase) {
      pilotCaseMarked = want;
      pilotPractitioner = undefined;
      if (
        pilotCase.practitionerId.toUpperCase() !==
          env.practitionerName().toUpperCase() ||
        pilotCase.status === "INITIAL"
      ) {
        throw new Error(
          `TEST_PILOT_CASE_CRN ${crn} must belong to the e2e practitioner and be past INITIAL, but is ${pilotCase.practitionerId} and ${pilotCase.status}`,
        );
      }
    } else {
      unavailable = `the API couldn't mark ${crn} as a pilot case - is the test support endpoint deployed to dev?`;
    }
  }
  const has = await practitionerHasPilotCase();
  test.skip(
    has !== want,
    want
      ? `Needs the e2e practitioner to have had a pilot case, and they haven't (${unavailable})`
      : `Needs the e2e practitioner never to have had a pilot case, and they have${crn ? " another pilot case in dev" : ` (${unavailable})`}`,
  );
};

/** Puts TEST_PILOT_CASE_CRN back to not being a pilot case, if a test marked it. */
export const resetPilotCase = async (): Promise<void> => {
  const crn = env.pilotCaseCrn();
  if (!crn || !pilotCaseMarked) return;
  await setPilotCase(crn, false, await getToken());
  pilotCaseMarked = false;
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
