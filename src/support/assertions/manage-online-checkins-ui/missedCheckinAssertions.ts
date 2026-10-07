import { expect } from "@playwright/test";
import { DateTime } from "luxon";
import { getCheckin } from "../../../api/checkin";

export const assertReviewedWhileExpired = async (
  uuid: string,
  token: string,
  sensitive: boolean,
): Promise<void> => {
  const {
    status,
    reviewedAt,
    sensitive: actualSensitive,
  } = await getCheckin(uuid, token);
  expect(status, "A reviewed missed check in should stay EXPIRED").toBe(
    "EXPIRED",
  );
  expect(actualSensitive, "Check-in sensitivity should match its notes").toBe(
    sensitive,
  );
  expect(
    DateTime.fromISO(reviewedAt ?? "").isValid,
    `Review should have set a readable reviewedAt, got ${reviewedAt}`,
  ).toBe(true);
};
