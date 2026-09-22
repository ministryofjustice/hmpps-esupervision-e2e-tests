import { test } from "@playwright/test";
import { getToken } from "../../api/auth";
import { createEsupervisionCheckin } from "../../api/checkin";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import { assertReviewedWhileExpired } from "../../support/assertions/manage-checkins-ui/missedCheckinAssertions";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import { firstCheckinDateString } from "../../support/utils/date";
import {
  expireCheckin,
  expiredDueDate,
} from "../../support/utils/expireCheckin";

const MISSED_REASON = "Person did not have access to a device";
const FIRST_UPDATE = "Discussed the missed check in at the next appointment";

/*
 * Nobody completes the check in, the expiry job marks it EXPIRED, and then the
 * practitioner records why it was missed and adds a couple of notes.
 *
 * Dev and local only - nowhere else lets a test trigger the job. The person's
 * first check in is a week away so the scheduler doesn't create a second one
 * today.
 */

test("missed check in: expiry job, review, then sensitive updates", async ({
  page,
}, testInfo) => {
  // Creating the offender, waiting for expiry and eight trips through MPOP
  // don't fit the default 180s.
  test.setTimeout(300_000);

  const journey = new OnlineCheckinJourney(page);
  const offender = await journey.createOffenderAndSetupCheckins(
    firstCheckinDateString(7),
  );
  await attachCreatedCrn(testInfo, offender.crn);

  const token = await getToken();
  const dueDate = expiredDueDate();
  const uuid = await createEsupervisionCheckin(offender.crn, dueDate, token);
  // Put on the report so a failure can be traced back to this check in.
  testInfo.annotations.push({
    type: "checkin",
    description: `uuid=${uuid} crn=${offender.crn} dueDate=${dueDate}`,
  });
  console.log("Setup completed.");

  const expiredAt = await expireCheckin(uuid, token);

  await journey.reviewMissedCheckin(
    offender.crn,
    {
      reason: MISSED_REASON,
      sensitive: false,
    },
    expiredAt,
  );

  await assertReviewedWhileExpired(uuid, token);

  // Marking the first update sensitive is what stops the page asking on the second.
  await journey.annotateMissedCheckin(offender.crn, {
    note: FIRST_UPDATE,
    sensitive: true,
    retains: [MISSED_REASON],
  });

  await journey.annotateSensitiveMissedCheckin(offender.crn, {
    note: "Agreed a plan for the next check in",
    retains: [MISSED_REASON, FIRST_UPDATE],
  });
});
