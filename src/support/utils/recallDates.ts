import { DateTime } from "luxon";

export function recallDates(now: DateTime = DateTime.now()) {
  if (!now.isValid) {
    throw new Error("Cannot plan a recall from an invalid date");
  }
  const today = now.setZone("Europe/London").startOf("day");
  const sentenceDate = today.minus({ months: 3 });

  // Six-month custodialAge25 sentence: released after a month, recalled
  // yesterday, so the sentence is still running when the recall is recorded.
  return {
    sentenceDate,
    releaseDate: sentenceDate.plus({ months: 1 }),
    recallDate: today.minus({ days: 1 }),
    expiryDate: sentenceDate.plus({ months: 6 }).minus({ days: 1 }),
  };
}
