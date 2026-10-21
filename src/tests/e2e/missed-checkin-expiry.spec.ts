import { expect, test } from "@playwright/test";
import { getToken } from "../../api/auth";
import { createEsupervisionCheckin } from "../../api/checkin";
import { assertJobAvailable } from "../../api/jobs";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import ManageCheckInsJourney from "../../support/journeys/manage-online-checkins-ui/manageCheckinsJourney";
import { FrequencyOptions } from "../../support/pages/manage-online-checkins-ui/checkInFrequencyPage";
import { assertReviewedWhileExpired } from "../../support/assertions/manage-online-checkins-ui/missedCheckinAssertions";
import {
  displayedCheckinDatePattern,
  firstCheckinDateString,
} from "../../support/utils/date";
import {
  expireCheckin,
  expiredDueDate,
} from "../../support/utils/expireCheckin";

const MISSED_REASON = "Person did not have access to a device";
const FIRST_UPDATE = "Discussed the missed check in at the next appointment";
const EXPIRY_JOB_TIMEOUT_MS = 5 * 60 * 1000;

test("missed check in: expiry job, review, then sensitive updates @expiry-job", async ({
  page,
}, testInfo) => {
  test.setTimeout(300_000);

  const token = await getToken();
  await assertJobAvailable("checkin-expiry", token);
  const dueDate = expiredDueDate();
  const journey = new OnlineCheckinJourney(page);
  const offender = await journey.createOffenderAndSetupCheckins(
    firstCheckinDateString(0),
    { profile: "custodialAge25" },
  );

  const checkinUuid = await createEsupervisionCheckin(
    offender.crn,
    dueDate,
    token,
  );
  testInfo.annotations.push({
    type: "checkin",
    description: `uuid=${checkinUuid} crn=${offender.crn} dueDate=${dueDate}`,
  });

  testInfo.setTimeout(testInfo.timeout + EXPIRY_JOB_TIMEOUT_MS);
  await expireCheckin(offender.crn, checkinUuid, token, {
    timeoutMs: EXPIRY_JOB_TIMEOUT_MS,
  });

  await journey.reviewMissedCheckin(offender.crn, checkinUuid, {
    reason: MISSED_REASON,
    sensitive: false,
  });
  await assertReviewedWhileExpired(checkinUuid, token, false);

  await journey.annotateMissedCheckin(offender.crn, checkinUuid, {
    note: FIRST_UPDATE,
    sensitive: true,
    retains: [MISSED_REASON],
  });
  // A non-sensitive update cannot clear the sensitivity already inherited.
  await journey.annotateMissedCheckin(offender.crn, checkinUuid, {
    note: "Agreed a plan for the next check in",
    sensitive: false,
    retains: [MISSED_REASON, FIRST_UPDATE],
  });
  await assertReviewedWhileExpired(checkinUuid, token, true);

  // A missed check in does not stop a recurring schedule: today's check in,
  // created at set up, is still the next one.
  await journey.assertOverviewNextCheckin(
    offender.crn,
    displayedCheckinDatePattern(0),
  );
});

test("missed ad hoc check in: nothing is scheduled afterwards @expiry-job", async ({
  page,
}, testInfo) => {
  test.setTimeout(300_000);

  const token = await getToken();
  await assertJobAvailable("checkin-expiry", token);
  const dueDate = expiredDueDate();
  const journey = new OnlineCheckinJourney(page);
  const offender = await journey.createOffenderAndSetupCheckins(undefined, {
    frequency: FrequencyOptions.AD_HOC,
  });

  const checkinUuid = await createEsupervisionCheckin(
    offender.crn,
    dueDate,
    token,
  );
  testInfo.annotations.push({
    type: "checkin",
    description: `uuid=${checkinUuid} crn=${offender.crn} dueDate=${dueDate}`,
  });

  testInfo.setTimeout(testInfo.timeout + EXPIRY_JOB_TIMEOUT_MS);
  await expireCheckin(offender.crn, checkinUuid, token, {
    timeoutMs: EXPIRY_JOB_TIMEOUT_MS,
  });

  const manage = await new ManageCheckInsJourney(page).openManage(offender.crn);
  await expect(
    manage.settingsNextCheckinDate(),
    "Nothing is booked after a missed ad hoc check in",
  ).toHaveCount(0);
  await expect(manage.scheduleCheckInButton()).toBeVisible();
  await journey.assertOverviewNextCheckin(
    offender.crn,
    "No online check in scheduled",
  );
});
