import { looseFragment } from "../../support/utils/dashboard/textMatching";

export interface DashboardRow {
  overall: string;
  region: RegExp;
}

export const ROW_SIGNED_UP = "Total number of people signed up to the service";
export const ROW_ACTIVE = "Number of people actively using the service";
export const ROW_STOPPED =
  "Number of people who have stopped using the service";

export const PEOPLE_ROW_SIGNED_UP: DashboardRow = {
  overall: ROW_SIGNED_UP,
  region: looseFragment("signed", "up", "to"),
};
export const PEOPLE_ROW_ACTIVE: DashboardRow = {
  overall: ROW_ACTIVE,
  region: looseFragment("actively", "using"),
};
export const PEOPLE_ROW_STOPPED: DashboardRow = {
  overall: ROW_STOPPED,
  region: looseFragment("have", "stopped"),
};

export const PEOPLE_ROWS: DashboardRow[] = [
  PEOPLE_ROW_SIGNED_UP,
  PEOPLE_ROW_ACTIVE,
  PEOPLE_ROW_STOPPED,
];

export const ROW_CHECKINS_COMPLETED = "Number of check ins completed";
export const ROW_CHECKINS_NOT_COMPLETED =
  "Number of check ins not completed on time";
export const ROW_CHECKINS_MEDIAN =
  "Average time to complete a check in (median)";
export const ROW_CHECKINS_P90 = "Average time to complete a check in (P90)";
export const ROW_CHECKINS_OVER_12HRS = "Number of check ins over 12hrs";
export const ROW_CHECKINS_PER_PERSON =
  "Average number of completed check ins per person";

export const CHECKIN_ROWS: DashboardRow[] = [
  {
    overall: ROW_CHECKINS_COMPLETED,
    region: looseFragment("check", "ins", "completed"),
  },
  {
    overall: ROW_CHECKINS_NOT_COMPLETED,
    region: looseFragment("not", "completed", "on"),
  },
  { overall: ROW_CHECKINS_MEDIAN, region: looseFragment("(median)") },
  { overall: ROW_CHECKINS_P90, region: looseFragment("(P90)") },
  { overall: ROW_CHECKINS_OVER_12HRS, region: looseFragment("over", "12hrs") },
  { overall: ROW_CHECKINS_PER_PERSON, region: looseFragment("per", "person") },
];

export const PEOPLE_ROW_LABELS = PEOPLE_ROWS.map((row) => row.overall);
export const CHECKIN_ROW_LABELS = CHECKIN_ROWS.map((row) => row.overall);

export const DURATION_ROWS = [ROW_CHECKINS_MEDIAN, ROW_CHECKINS_P90];

export const REGION_ROWS_WITHOUT_PERCENTAGE: string[] = [
  ...DURATION_ROWS,
  ROW_CHECKINS_OVER_12HRS,
  ROW_CHECKINS_PER_PERSON,
];

export const REGION_SUMMABLE_ROWS: string[] = [
  ROW_SIGNED_UP,
  ROW_ACTIVE,
  ROW_STOPPED,
  ROW_CHECKINS_COMPLETED,
  ROW_CHECKINS_NOT_COMPLETED,
];
