import process from "process";
import { ExistingTier } from "../data/models";

/** Env vars holding pre-existing CRNs for the eligibility tests. */
const EXISTING_TIER_CRN_ENV: Record<ExistingTier, string> = {
  A: "TEST_TIER_A_CRN",
  B: "TEST_TIER_B_CRN",
  C: "TEST_TIER_C_CRN",
  D: "TEST_TIER_D_CRN",
  E: "TEST_TIER_E_CRN",
  F: "TEST_TIER_F_CRN",
  G: "TEST_TIER_G_CRN",
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check your .env.${envName()} file.`,
    );
  }
  return value;
}

function requiredCrn(name: string): string {
  return required(name).trim();
}

export function envName(): string {
  return process.env.ENV ?? "dev";
}

export const env = {
  name: envName,
  checkInUrl: (): string => required("PROBATION_CHECK_IN_URL"),
  dashboardUrl: (): string => required("DASHBOARD_URL"),
  authUrl: (): string => required("AUTH_URL"),
  authClientId: (): string => required("AUTH_CLIENT_ID"),
  authClientSecret: (): string => required("AUTH_CLIENT_SECRET"),
  esupervisionApiUrl: (): string => required("ESUPERVISION_API_URL"),
  mpopUrl: (): string => required("MPOP_URL"),
  manageCheckinsUiUrl: (): string => required("MANAGE_CHECKINS_UI_URL"),
  deliusUsername: (): string => required("DELIUS_USERNAME"),
  deliusPassword: (): string => required("DELIUS_PASSWORD"),
  requireOasys: (): void => {
    // Called by OasysAssessmentJourney when assigning a tier to a newly created offender.
    // New offenders in Delius have no tier, so Layer 1 assessment determines it via OASys.
    required("OASYS_URL");
    process.env.OASYS_USERNAME_BOOKING = required("OASYS_USERNAME");
    process.env.OASYS_PASSWORD_BOOKING = required("OASYS_PASSWORD");
  },
  practitionerName: (): string => required("PRACTITIONER_NAME"),
  manageCrn: (): string => requiredCrn("TEST_MANAGE_CRN"),
  mpopStopRestartCrn: (): string => requiredCrn("TEST_MPOP_STOP_RESTART_CRN"),
  tierMissingCrn: (): string => requiredCrn("TEST_TIER_MISSING_CRN"),
  tierNotSupervisedCrn: (): string =>
    requiredCrn("TEST_TIER_NOT_SUPERVISED_CRN"),
  noPackageCrn: (): string => requiredCrn("TEST_NO_PACKAGE_CRN"),
  finalThirdCrn: (): string => requiredCrn("TEST_FINAL_THIRD_CRN"),
  earlyEngagementCrn: (): string => requiredCrn("TEST_EARLY_ENGAGEMENT_CRN"),
  tierCrn: (tier: ExistingTier): string =>
    requiredCrn(EXISTING_TIER_CRN_ENV[tier]),
};
