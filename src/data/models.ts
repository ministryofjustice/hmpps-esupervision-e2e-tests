import { randomPicker, randomItems } from "../support/utils/common";

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

export interface AssistanceDetails {
  money?: string;
  housing?: string;
  employmentEducation?: string;
  mentalHealth?: string;
  alcohol?: string;
  drugs?: string;
  relationships?: string;
  other?: string;
}

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
