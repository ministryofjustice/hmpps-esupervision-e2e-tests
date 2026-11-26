import assert from "node:assert/strict";
import { test } from "node:test";
import { DateTime } from "luxon";
import { recallDates } from "./recallDates";

for (const date of ["2026-11-26", "2027-03-31", "2027-10-31", "2028-02-29"]) {
  test(`sentence is released, then recalled before expiry on ${date}`, () => {
    const now = DateTime.fromISO(date, { zone: "Europe/London" });
    const { sentenceDate, releaseDate, recallDate, expiryDate } =
      recallDates(now);

    assert.ok(sentenceDate < releaseDate);
    assert.ok(releaseDate < recallDate);
    assert.ok(recallDate < now.startOf("day"));
    assert.ok(recallDate < expiryDate);
  });
}

test("rejects an invalid date", () => {
  assert.throws(() => recallDates(DateTime.invalid("test")));
});
