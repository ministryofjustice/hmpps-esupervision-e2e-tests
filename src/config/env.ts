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
  restartAccreditedCrn: (): string =>
    requiredCrn("TEST_RESTART_ACCREDITED_CRN"),
  tierNotSupervisedCrn: (): string =>
    requiredCrn("TEST_TIER_NOT_SUPERVISED_CRN"),
  noPackageCrn: (): string => requiredCrn("TEST_NO_PACKAGE_CRN"),
  finalThirdCrn: (): string => requiredCrn("TEST_FINAL_THIRD_CRN"),
  earlyEngagementCrn: (): string => requiredCrn("TEST_EARLY_ENGAGEMENT_CRN"),
  tierCrn: (tier: ExistingTier): string =>
    requiredCrn(EXISTING_TIER_CRN_ENV[tier]),
  adhocCrn: (): string => requiredCrn("TEST_ADHOC_CRN"),
  noActiveSentenceCrn: (): string | undefined =>
    requiredCrn("TEST_NO_ACTIVE_SENTENCE_CRN"),
  inResetCrn: (): string | undefined => requiredCrn("TEST_IN_RESET_CRN"),
  recalledCrn: (): string | undefined => requiredCrn("TEST_RECALLED_CRN"),
  provisionalTierCrn: (): string | undefined =>
    requiredCrn("TEST_PROVISIONAL_TIER_CRN"),
  unallocatedCrn: (): string | undefined => requiredCrn("TEST_UNALLOCATED_CRN"),
  /**
   * Whether MOCI's `useEligibilityEndpoint` flag is on in the environment under test, so the ESUP
   * API decides eligibility: no Recalled box, no pilot question. On unless ELIGIBILITY_ENDPOINT is
   * "off" - set that while the flag is off, until the old journey's tests are removed.
   */
  eligibilityEndpoint: (): boolean =>
    !["off", "false"].includes(
      (process.env.ELIGIBILITY_ENDPOINT ?? "on").trim().toLowerCase(),
    ),
};
