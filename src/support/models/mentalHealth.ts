import { randomPicker } from "../utils/common";


export type MentalHealthOption =
  | "VERY_WELL"
  | "WELL"
  | "OK"
  | "NOT_GREAT"
  | "STRUGGLING";

export const MENTAL_HEALTH_OPTIONS:  MentalHealthOption[] = [
  "VERY_WELL",
  "WELL",
  "OK",
  "NOT_GREAT",
  "STRUGGLING",
];

export const randomMentalHealthOption = (): MentalHealthOption=> randomPicker(MENTAL_HEALTH_OPTIONS)
