import { DateTime } from "luxon";

export type YearMonth = string;

const ZONE = "Europe/London";

export const toMonthValue = (date: DateTime): YearMonth =>
  date.setZone(ZONE).toFormat("yyyy-MM");

export const currentMonth = (): YearMonth => toMonthValue(DateTime.now());
