import process from "process";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check your .env.${envName()} file.`,
    );
  }
  return value;
}

export interface TestPersonConfig {
  firstName: string;
  lastName: string;
  dob: string;
}

export function envName(): string {
  return process.env.ENV ?? "dev";
}

export const env = {
  name: envName,
  checkInUrl: (): string => required("PROBATION_CHECK_IN_URL"),
  authUrl: (): string => required("AUTH_URL"),
  authClientId: (): string => required("AUTH_CLIENT_ID"),
  authClientSecret: (): string => required("AUTH_CLIENT_SECRET"),
  esupervisionApiUrl: (): string => required("ESUPERVISION_API_URL"),
  mpopUrl: (): string => required("MPOP_URL"),
  deliusUsername: (): string => required("DELIUS_USERNAME"),
  deliusPassword: (): string => required("DELIUS_PASSWORD"),
  practitionerName: (): string => required("PRACTITIONER_NAME"),
  testCrn: (): string => required("TEST_CRN"),
  testPerson: (): TestPersonConfig => ({
    firstName: required("TEST_PERSON_FIRST_NAME"),
    lastName: required("TEST_PERSON_LAST_NAME"),
    dob: required("TEST_PERSON_DOB"),
  }),
  mpopTestCrn: (): string => required("TEST_MPOP_CRN"),
  mpopStopRestartCrn: (): string => required("TEST_MPOP_STOP_RESTART_CRN"),
  deliusUrl: (): string => required("TEST_MPOP_CRN"),
  deliusProvider: (): string => required("TEST_MPOP_STOP_RESTART_CRN"),
  deliusTeam: (): string => required("TEST_MPOP_STOP_RESTART_CRN"),
  deliusStaff: (): string => required("TEST_MPOP_CRN"),
};
