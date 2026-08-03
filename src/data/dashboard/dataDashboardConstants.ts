import { YearMonth } from "../../support/utils/month";

export const DATA_DASHBOARD_HEADING =
  "Check in with your probation officer data dashboard";

/** START_DEFAULT- the earliest selectable month. */
export const EARLIEST_MONTH: YearMonth = "2025-08";

export const DATA_DASHBOARD_PATH = "/v2statistics";
export const REGION_DASHBOARD_PATH = "/v2statistics/region";

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

/** The single row of the feedback response count table. */
export const FEEDBACK_TOTAL_ROW = "Number of responses";

export const FEEDBACK_RESPONSES_ROW_LABELS = [FEEDBACK_TOTAL_ROW];

/** Feedback tables whose percentage is a share of the total responses. */
export const FEEDBACK_TABLES = [
  TABLE_HOW_EASY,
  TABLE_GETTING_SUPPORT,
  TABLE_IMPROVEMENTS,
];

/** Last row of every feedback table, rendered without a percentage. */
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

/** Row labels for each feedback table, in the same order as FEEDBACK_TABLES. */
export const FEEDBACK_TABLE_ROWS = [
  { caption: TABLE_HOW_EASY, rows: HOW_EASY_ROW_LABELS },
  { caption: TABLE_GETTING_SUPPORT, rows: GETTING_SUPPORT_ROW_LABELS },
  { caption: TABLE_IMPROVEMENTS, rows: IMPROVEMENTS_ROW_LABELS },
];

/** Rows on the People table, by the role they play in the totals. */
export const ROW_SIGNED_UP = "Total number of people signed up to the service";
export const ROW_ACTIVE = "Number of people actively using the service";
export const ROW_STOPPED =
  "Number of people who have stopped using the service";

/** Full row list, in order, so a dropped/reordered/relabelled row is caught. */
export const PEOPLE_ROW_LABELS = [
  "Total number of people signed up to the service",
  "Number of people actively using the service",
  "Number of people who have stopped using the service",
];

/** Rows on the Check ins table that show a percentage. */
export const ROW_CHECKINS_COMPLETED = "Number of check ins completed";
export const ROW_CHECKINS_NOT_COMPLETED =
  "Number of check ins not completed on time";

export const CHECKIN_ROW_LABELS = [
  ROW_CHECKINS_COMPLETED,
  ROW_CHECKINS_NOT_COMPLETED,
  "Average time to complete a check in (median)",
  "Average time to complete a check in (P90)",
  "Number of check ins over 12hrs",
  "Average number of completed check ins per person",
];

/** Overall tab rows rendered by the hoursToHoursAndMinutes filter. */
export const DURATION_ROWS = [
  "Average time to complete a check in (median)",
  "Average time to complete a check in (P90)",
];

export const REGION_MATRIX_PEOPLE = "People on probation";
export const REGION_MATRIX_CHECKINS = "Check ins";

/** Row headers contain <br> tags, so matched on a fragment, not the full label. */
export const REGION_PEOPLE_ROWS: RegExp[] = [
  /signed up to/,
  /actively using/,
  /have stopped/,
];

export const REGION_CHECKIN_ROWS: RegExp[] = [
  /check ins\s*completed/,
  /not completed on/,
  /\(median\)/,
  /\(P90\)/,
  /over 12hrs/,
  /per person/,
];

/** Matrix rows that render an em dash instead of a percentage. */
export const REGION_ROWS_WITHOUT_PERCENTAGE: RegExp[] = [
  /\(median\)/,
  /\(P90\)/,
  /over 12hrs/,
  /per person/,
];

/** Output of the percentage(2) filter, e.g. "12.34%"; tolerant of stray whitespace. */
export const PERCENTAGE_FORMAT = /^\s*\d+\.\d{2}%\s*$/;

/** Output of the hoursToHoursAndMinutes filter, e.g. "2h 15m". */
export const DURATION_FORMAT = /^\s*\d+h \d{1,2}m\s*$/;

/** A plain count or average, e.g. "47" or "1.8". */
export const NUMBER_FORMAT = /^\s*\d+(\.\d+)?\s*$/;

/** Rendered where a row has no percentage to show. */
export const EM_DASH = "\u2014";

/** Region rows that sum across columns to the Total; averages (median/P90/per-person) don't. */
export const REGION_SUMMABLE_ROWS: RegExp[] = [
  /signed up to/,
  /actively using/,
  /have stopped/,
  /check ins\s*completed/,
  /not completed on/,
  /over 12hrs/,
];

/** Rows affected by a known API bug: unmapped providers duplicate the total here. */
export const REGION_ROWS_WITH_PROVIDER_COLLISION: RegExp[] = [/over 12hrs/];

/** Dev-only test regions, excluded from the sum check for the rows above. */
export const REGION_NAMES_EXCLUDED_FROM_SUM = [
  "No Trust or Trust Unknown",
  "CPA Training",
  "Dummy Trust - nDelius SPG Sender Identity",
];

/** Neither dashboard template sets a pageTitle, so both tabs share the layout's default. */
export const PAGE_TITLE = "Check in with your probation officer";

/** applicationName and serviceName in nunjucksSetup.ts. */
export const SERVICE_NAME = "Check in with your probation officer";

export const PHASE_TAG = "Private Beta";

export interface FooterLink {
  name: string;
  href: string;
}

/** The meta items in the govukFooter call in partials/layout.njk. */
export const FOOTER_LINKS: FooterLink[] = [
  { name: "Accessibility statement", href: "/accessibility" },
  { name: "Privacy", href: "/privacy-notice" },
];
