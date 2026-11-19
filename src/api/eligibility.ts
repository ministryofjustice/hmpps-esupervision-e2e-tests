import { env } from "../config/env";
import { EligibilityAnswer } from "../data/models";
import { assertOk, authHeader, withApiContext } from "./apiHelper";

/** The practitioner's answers, as the ESUP API takes them. The A/B questions are null for other tiers. */
export interface EligibilityAnswers {
  accreditedProgramme: boolean | null;
  deviceRestriction: boolean;
  youthSentence: boolean | null;
}

export interface EligibilityCheck {
  /** UNKNOWN when the rules need answers that weren't given. */
  outcome: "ELIGIBLE" | "INELIGIBLE" | "UNKNOWN";
  message: string | null;
  /** The rule that decided, e.g. IS_TIER_C. */
  ruleCode: string | null;
}

/** The rule that makes a Tier A/B person on an accredited programme eligible (MOCI's programme route). */
export const ACCREDITED_PROGRAMME_RULE = "IN_EARLY_ENGAGEMENT";

/** The checkbox answers as MOCI sends them: the A/B questions only for a Tier A/B person. */
export const toEligibilityAnswers = (
  selections: EligibilityAnswer[],
  tierAB: boolean,
): EligibilityAnswers => ({
  accreditedProgramme: tierAB
    ? selections.includes("accreditedProgramme")
    : null,
  deviceRestriction: selections.includes("deviceRestriction"),
  youthSentence: tierAB ? selections.includes("youthSentence") : null,
});

/**
 * POST /v2/offenders/crn/{crn}/eligibility - the check MOCI makes when useEligibilityEndpoint is on.
 * MOCI sends the allocated practitioner; this sends the e2e practitioner, who is allocated every
 * CRN the suite uses.
 */
export const checkEligibility = async (
  crn: string,
  answers: EligibilityAnswers | null,
  token: string,
  practitionerId: string = env.practitionerName(),
): Promise<EligibilityCheck> =>
  withApiContext(async (ctx) => {
    const response = await ctx.post(`/v2/offenders/crn/${crn}/eligibility`, {
      headers: authHeader(token),
      data: {
        practitionerId,
        ...(answers ? { eligibilityAnswers: answers } : {}),
      },
    });
    await assertOk(response, `Check eligibility for ${crn}`);
    return (await response.json()) as EligibilityCheck;
  });
