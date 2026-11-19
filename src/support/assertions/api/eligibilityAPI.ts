import { expect } from "@playwright/test";
import { getToken } from "../../../api/auth";
import {
  checkEligibility,
  EligibilityAnswers,
  EligibilityCheck,
} from "../../../api/eligibility";
import { env } from "../../../config/env";

const NO_ANSWERS_TIER_C: EligibilityAnswers = {
  accreditedProgramme: null,
  deviceRestriction: false,
  youthSentence: null,
};

let pilotPractitioner: Promise<boolean> | undefined;

/**
 * Whether the e2e practitioner has ever had a pilot case (someone in online check ins before
 * 1 October 2026), which decides Tier C, and Tier A/B off an accredited programme. Nothing can set
 * this in dev yet, so it is read from the API's decision for the Tier C CRN, and tests that need
 * one answer or the other skip when dev holds the other.
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
