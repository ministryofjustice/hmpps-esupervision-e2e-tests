import { randomPicker, randomItems } from "../utils/common";


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
  const option = randomPicker(ALL_OPTIONS)
  return { option,comment:`Test comment for ${option}`}
}

export const randomAssistanceSelections=(count=1):AssistanceSelection[] => 
    randomItems(ALL_OPTIONS,count).map(option => ({
        option,
        comment:`Test comment for ${option}`
    }))
