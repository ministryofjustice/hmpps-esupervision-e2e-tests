import { DateTime } from "luxon";

export const today = DateTime.now();

export const dueDateString = (date: DateTime): string => {
  return date.toFormat("yyyy-M-d");
};

export const dobParts = (
  dob: Date,
): { day: string; month: string; year: string } => ({
  day: dob.getDate().toString(),
  month: (dob.getMonth() + 1).toString(),
  year: dob.getFullYear().toString(),
});

export const firstCheckinDateString = (daysAhead = 7): string =>
  DateTime.now().plus({ days: daysAhead }).toFormat("d/M/yyyy");

/** The date as the manage page renders it, e.g. "25 August 2026". */
export const displayedCheckinDate = (daysAhead = 7): string =>
  DateTime.now().plus({ days: daysAhead }).toFormat("d MMMM yyyy");

/**
 * The same date, anchored so it cannot match inside a longer one - "5 August 2026"
 * is a substring of "25 August 2026". Use this with toContainText rather than the
 * bare string. No escaping needed: the format is digits, letters and spaces.
 */
export const displayedCheckinDatePattern = (daysAhead = 7): RegExp =>
  new RegExp(`(^|\\D)${displayedCheckinDate(daysAhead)}`);

export const isoDateString = (date: DateTime): string => {
  return date.toFormat("yyyy-MM-dd");
};
