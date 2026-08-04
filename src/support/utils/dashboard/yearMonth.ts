import { DateTime } from "luxon";

declare const yearMonth: unique symbol;

export type YearMonth = string & { readonly [yearMonth]: "YearMonth" };

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export const asYearMonth = (value: string): YearMonth => {
  if (!YEAR_MONTH.test(value)) {
    throw new Error(`Expected a YYYY-MM month but got "${value}"`);
  }
  return value as YearMonth;
};

const ZONE = "Europe/London";

const toMonthValue = (date: DateTime): YearMonth =>
  asYearMonth(date.setZone(ZONE).toFormat("yyyy-MM"));

export const currentMonth = (): YearMonth => toMonthValue(DateTime.now());
