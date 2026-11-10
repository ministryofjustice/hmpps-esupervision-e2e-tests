import assert from "node:assert/strict";
import { test } from "node:test";
import { DateTime } from "luxon";
import { finalThirdDates } from "./finalThirdDates";

for (const date of ["2026-11-10", "2027-03-31", "2027-10-31", "2028-02-29"]) {
  test(`sentence is released, unexpired and in its final third on ${date}`, () => {
    const now = DateTime.fromISO(date, { zone: "Europe/London" });
    const { sentenceDate, releaseDate, expiryDate } = finalThirdDates(now);
    const lengthInDays = Math.round(
      expiryDate.plus({ days: 1 }).diff(sentenceDate, "days").days,
    );
    const finalThirdDate = expiryDate.minus({
      days: Math.ceil(lengthInDays / 3),
    });

    assert.ok(sentenceDate < releaseDate);
    assert.ok(releaseDate < finalThirdDate);
    assert.ok(finalThirdDate < now);
    assert.ok(now < expiryDate);
  });
}

test("uses the London calendar date at a UTC month boundary", () => {
  const { sentenceDate } = finalThirdDates(
    DateTime.fromISO("2027-03-31T23:30:00Z"),
  );
  assert.equal(sentenceDate.toISODate(), "2026-11-01");
});

test("rejects an invalid date before any setup can begin", () => {
  assert.throws(
    () => finalThirdDates(DateTime.invalid("invalid test date")),
    /invalid date/,
  );
});
