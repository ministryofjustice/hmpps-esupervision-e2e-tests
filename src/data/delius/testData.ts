import { OasysAssessment } from "../models";
import { Staff, Team } from "./types";
import type { OffenderProfile } from "../../support/journeys/ndelius/deliusOffenderJourney";

export const TEST_TEAM: Team = {
  name: "Default Designated Transfer Team",
  provider: "East of England",
};

export const TEST_STAFF: Staff = {
  name: "Test Account, Authomation E2E (PS - Other)",
  firstName: "Authomation E2E",
  lastName: "Test Account",
};

/**
 * For offenders that complete setup - MOCI rules out a person with no tier
 * before any question. The journey follows whichever tier results.
 */
export const SETUP_ASSESSMENT: OasysAssessment = {
  highRosh: false,
  sexualOffence: false,
  firstSanctionAge: 15,
};

export const TIER_C_ASSESSMENT: OasysAssessment = {
  highRosh: false,
  sexualOffence: true,
  firstSanctionAge: 15,
  currentOffenceSexuallyMotivated: false,
  partnerRelationshipNoProblems: true,
  offenceCode: "041",
  offenceSubCode: "00",
  totalSanctions: 1,
  violentSanctions: 0,
};

export const PROFILE_ASSESSMENTS: Record<OffenderProfile, OasysAssessment> = {
  custodialAge25: SETUP_ASSESSMENT,
  highRiskAge25: { highRosh: true, sexualOffence: true, firstSanctionAge: 15 },
  tierCAge25: TIER_C_ASSESSMENT,
};
