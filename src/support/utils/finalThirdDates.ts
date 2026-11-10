import { DateTime } from "luxon";

export function finalThirdDates(now: DateTime = DateTime.now()) {
  if (!now.isValid) {
    throw new Error("Cannot plan a final-third sentence from an invalid date");
  }
  const today = now.setZone("Europe/London").startOf("day");
  const sentenceDate = today.minus({ months: 5 });

  // Matches the six-month custodialAge25 profile: released after three months,
  // past the four-month final-third boundary, with about a month remaining.
  return {
    sentenceDate,
    releaseDate: sentenceDate.plus({ months: 3 }),
    expiryDate: sentenceDate.plus({ months: 6 }).minus({ days: 1 }),
  };
}
