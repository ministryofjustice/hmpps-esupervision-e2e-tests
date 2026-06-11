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
  today.plus({ days: daysAhead }).toFormat("d/M/yyyy");
