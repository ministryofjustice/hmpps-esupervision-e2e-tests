import { randomPicker, randomItems } from "../support/utils/random";

export type MentalHealthOption =
  | "VERY_WELL"
  | "WELL"
  | "OK"
  | "NOT_GREAT"
  | "STRUGGLING";

export const MENTAL_HEALTH_OPTIONS: MentalHealthOption[] = [
  "VERY_WELL",
  "WELL",
  "OK",
  "NOT_GREAT",
  "STRUGGLING",
];

export const randomMentalHealthOption = (): MentalHealthOption =>
  randomPicker(MENTAL_HEALTH_OPTIONS);

export const FEELING_ROW_KEY = "has been feeling";

export const ASSISTANCE_ROW_KEY = "need support with";

export type AssistanceOption =
  | "MENTAL_HEALTH"
  | "ALCOHOL"
  | "DRUGS"
  | "MONEY"
  | "HOUSING"
  | "EMPLOYMENT_EDU"
  | "SUPPORT_SYSTEM"
  | "OTHER"
  | "NO_HELP";

export type AssistanceOptionWithComment = Exclude<AssistanceOption, "NO_HELP">;

export interface AssistanceSelection {
  option: AssistanceOptionWithComment;
  comment: string;
}

const ALL_OPTIONS: AssistanceOptionWithComment[] = [
  "MENTAL_HEALTH",
  "ALCOHOL",
  "DRUGS",
  "MONEY",
  "HOUSING",
  "EMPLOYMENT_EDU",
  "SUPPORT_SYSTEM",
  "OTHER",
];

export const randomAssistanceSelection = (): AssistanceSelection => {
  const option = randomPicker(ALL_OPTIONS);
  return { option, comment: `Test comment for ${option}` };
};

export const randomAssistanceSelections = (count = 1): AssistanceSelection[] =>
  randomItems(ALL_OPTIONS, count).map((option) => ({
    option,
    comment: `Test comment for ${option}`,
  }));

export interface CheckInPerson {
  firstName: string;
  lastName: string;
  dob: Date;
}

export interface CompletedCheckinDetails {
  mentalHealth: MentalHealthOption;
  assistance: AssistanceSelection[];
}
