import test from "@playwright/test";
import { MissedCheckinReview } from "../../data/models";
import { getToken } from "../../api/auth";
import ReviewCheckinJourney from "../../support/journeys/mpop/reviewCheckinJourney";
import {
  pickExpiredCheckinFromPool,
  PoolCheckin,
} from "../../support/utils/missedCheckin";

/**
 * Reviewing a check in the person never completed. MOCI renders these pages,
 * hence this suite rather than mpop.
 *
 * Borrows a CRN from the environment's pool of already-expired check ins
 * rather than creating one. Not recorded via attachCreatedCrn, since the CRN
 * isn't ours to delete.
 */
let pooled: PoolCheckin | undefined;

const REVIEW: MissedCheckinReview = {
  note: "E2E automated missed check in review",
  sensitive: true,
};

test.beforeAll(async () => {
  const token = await getToken();
  pooled = await pickExpiredCheckinFromPool(token);
});

test("practitioner reviews a missed online check in", async ({ page }) => {
  test.skip(!pooled, "No CRN with a missed check in was found in the pool");

  const journey = new ReviewCheckinJourney(page);
  await journey.login();
  await journey.reviewMissedCheckin(pooled!.crn, REVIEW);
});
