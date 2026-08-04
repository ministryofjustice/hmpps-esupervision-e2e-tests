import {
  CHECKIN_ROW_LABELS,
  CHECKIN_ROWS,
  type DashboardRow,
  PEOPLE_ROW_LABELS,
  PEOPLE_ROWS,
  ROW_CHECKINS_MEDIAN,
  ROW_CHECKINS_OVER_12HRS,
  ROW_CHECKINS_P90,
  ROW_CHECKINS_PER_PERSON,
  ROW_SIGNED_UP,
} from "./rows";

export const TABLE_PEOPLE = "People on probation";
export const TABLE_CHECKINS = "Check ins";
export const TABLE_FEEDBACK_RESPONSES =
  "Number of responses to the feedback form";
export const TABLE_HOW_EASY =
  "How easy was it for the person on probation to use online check ins";
export const TABLE_GETTING_SUPPORT =
  "Does the person on probation believe they are getting the support they need from probation";
export const TABLE_IMPROVEMENTS =
  "What parts of online check ins does the person think we could improve";

export type TableCaption =
  | typeof TABLE_PEOPLE
  | typeof TABLE_CHECKINS
  | typeof TABLE_FEEDBACK_RESPONSES
  | typeof TABLE_HOW_EASY
  | typeof TABLE_GETTING_SUPPORT
  | typeof TABLE_IMPROVEMENTS;

export const REGION_MATRIX_PEOPLE = TABLE_PEOPLE;
export const REGION_MATRIX_CHECKINS = TABLE_CHECKINS;

export type MatrixTitle =
  typeof REGION_MATRIX_PEOPLE | typeof REGION_MATRIX_CHECKINS;

export const FEEDBACK_TOTAL_ROW = "Number of responses";
export const FEEDBACK_RESPONSES_ROW_LABELS = [FEEDBACK_TOTAL_ROW];

export const FEEDBACK_NOT_ANSWERED_ROW = "Not answered";

export const HOW_EASY_ROW_LABELS = [
  "Very easy",
  "Easy",
  "Neither easy or difficult",
  "Difficult",
  "Very difficult",
  FEEDBACK_NOT_ANSWERED_ROW,
];

export const GETTING_SUPPORT_ROW_LABELS = [
  "Yes",
  "No",
  FEEDBACK_NOT_ANSWERED_ROW,
];

export const IMPROVEMENTS_ROW_LABELS = [
  "Finding out about online check ins",
  "Being signed up to online check ins",
  "Text or email notifications",
  "Questions within the check in",
  "Taking a video to check your identity",
  "Getting help when something goes wrong",
  "What happened after you told probation you needed support",
  "What happened after you asked for contact from probation",
  "Something else",
  "Nothing needs to improve",
  FEEDBACK_NOT_ANSWERED_ROW,
];

export interface FeedbackTableSpec {
  caption: TableCaption;
  rows: string[];
  multiSelect: boolean;
}

export const FEEDBACK_TABLE_ROWS: FeedbackTableSpec[] = [
  { caption: TABLE_HOW_EASY, rows: HOW_EASY_ROW_LABELS, multiSelect: false },
  {
    caption: TABLE_GETTING_SUPPORT,
    rows: GETTING_SUPPORT_ROW_LABELS,
    multiSelect: false,
  },
  {
    caption: TABLE_IMPROVEMENTS,
    rows: IMPROVEMENTS_ROW_LABELS,
    multiSelect: true,
  },
];

export interface OverallTableSpec {
  caption: TableCaption;
  rows: string[];
  hasPercentageColumn: boolean;
  rowsWithoutPercentage: string[];
}

export const OVERALL_TABLES: OverallTableSpec[] = [
  {
    caption: TABLE_PEOPLE,
    rows: PEOPLE_ROW_LABELS,
    hasPercentageColumn: true,
    rowsWithoutPercentage: [ROW_SIGNED_UP],
  },
  {
    caption: TABLE_CHECKINS,
    rows: CHECKIN_ROW_LABELS,
    hasPercentageColumn: true,
    rowsWithoutPercentage: [
      ROW_CHECKINS_MEDIAN,
      ROW_CHECKINS_P90,
      ROW_CHECKINS_OVER_12HRS,
      ROW_CHECKINS_PER_PERSON,
    ],
  },
  {
    caption: TABLE_FEEDBACK_RESPONSES,
    rows: FEEDBACK_RESPONSES_ROW_LABELS,
    hasPercentageColumn: false,
    rowsWithoutPercentage: [],
  },
  ...FEEDBACK_TABLE_ROWS.map(({ caption, rows }) => ({
    caption,
    rows,
    hasPercentageColumn: true,
    rowsWithoutPercentage: [FEEDBACK_NOT_ANSWERED_ROW],
  })),
];

export const OVERALL_TABLE_CAPTIONS: TableCaption[] = OVERALL_TABLES.map(
  (table) => table.caption,
);

export interface CrossTabTable {
  caption: TableCaption;
  matrix: MatrixTitle;
  rows: DashboardRow[];
}

export const CROSS_TAB_TABLES: CrossTabTable[] = [
  { caption: TABLE_PEOPLE, matrix: REGION_MATRIX_PEOPLE, rows: PEOPLE_ROWS },
  {
    caption: TABLE_CHECKINS,
    matrix: REGION_MATRIX_CHECKINS,
    rows: CHECKIN_ROWS,
  },
];

export interface RegionMatrixSpec {
  title: MatrixTitle;
  rows: DashboardRow[];
}

export const REGION_MATRICES: RegionMatrixSpec[] = CROSS_TAB_TABLES.map(
  ({ matrix, rows }) => ({ title: matrix, rows }),
);
