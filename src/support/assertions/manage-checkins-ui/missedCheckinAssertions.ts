import { expect } from "@playwright/test";
import { DateTime } from "luxon";
import { getCheckin } from "../../../api/checkin";

/** Reviewing a missed check in doesn't change its status. It stays EXPIRED and
 *  gains a review date. */
export const assertReviewedWhileExpired = async (
  uuid: string,
  token: string,
): Promise<void> => {
  const { status, reviewedAt } = await getCheckin(uuid, token);
  expect(status, "A reviewed missed check in should stay EXPIRED").toBe(
    "EXPIRED",
  );
  // Parse the date rather than just checking it's set - a missing field would
  // sail past a null check.
  expect(
    DateTime.fromISO(reviewedAt ?? "").isValid,
    `Review should have set a readable reviewedAt, got ${reviewedAt}`,
  ).toBe(true);
};
