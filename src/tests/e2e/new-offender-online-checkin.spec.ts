import { getToken } from "../../api/auth";
import { test } from "@playwright/test";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import { waitForAwaitingCheckinUuid } from "../../support/utils/waitForCheckin";
import { NewOffender } from "../../data/delius/types";
import { createEsupervisionCheckin } from "../../api/checkin";
import {
  dueDateString,
  today,
  firstCheckinDateString,
} from "../../support/utils/date";
import {
  Annotation,
  ReviewDecision,
} from "../../support/journeys/mpop/reviewCheckinJourney";
import { IdentityDecision } from "../../support/pages/mpop/reviewIdentityPage";
import {
  readCreatedCrns,
  writeCreatedCrns,
} from "../../support/utils/createdCrns";
import { cleanupCrns } from "../../scripts/cleanupCrns";

interface CheckinScenario {
  name: string;
  firstCheckinDaysAhead: number;
  getCheckinUuid: (offender: NewOffender, token: string) => Promise<string>;
  review?: ReviewDecision;
  annotation?: Annotation;
}

const apiCheckin = (offender: NewOffender, token: string): Promise<string> =>
  createEsupervisionCheckin(offender.crn, dueDateString(today), token);

const scenarios: CheckinScenario[] = [
  {
    name: "checkin created by the scheduler - first checkin today, MATCH review",
    firstCheckinDaysAhead: 0,
    getCheckinUuid: (offender, token) =>
      waitForAwaitingCheckinUuid(offender.crn, token),
    review: {
      identity: IdentityDecision.MATCH,
      riskManagement: false,
      sensitive: false,
      note: "Identity confirmed, nothing concerning",
    },
    annotation: { note: "Reviewed, no further action", sensitive: false },
  },
  {
    name: "checkin created via API - first check in date in the future, NO_MATCH review",
    firstCheckinDaysAhead: 4,
    getCheckinUuid: apiCheckin,
    review: {
      identity: IdentityDecision.NO_MATCH,
      riskManagement: true,
      sensitive: true,
      note: "Person in the checkin is not the offender",
    },
    annotation: { note: "Logged ID mismatch", sensitive: true },
  },

  {
    name: "checkin created via API - first check in date in the future, MATCH_WITH_CONCERN review",
    firstCheckinDaysAhead: 4,
    getCheckinUuid: apiCheckin,
    review: {
      identity: IdentityDecision.MATCH_WITH_CONCERN,
      riskManagement: false,
      sensitive: false,
      note: "Identity matches but appearance is concerning",
    },
    annotation: {
      note: "Follow-up after concerning check in",
      sensitive: false,
    },
  },
];

let e2ePassed = true;

test.afterEach(() => {
  const testInfo = test.info();
  if (testInfo.status !== testInfo.expectedStatus) {
    e2ePassed = false;
  }
});

test.afterAll(async () => {
  const crns = readCreatedCrns();
  if (crns.length === 0) return;

  if (!e2ePassed) {
    console.log(
      `e2e failed - keeping ${crns.length} offender(s) for investigation: ${crns.join(",")}`,
    );
    return;
  }

  const failed = await cleanupCrns(crns);
  writeCreatedCrns(failed);
  console.log(
    failed.length > 0
      ? `Cleanuo: ${failed.length} offender(S) could not be deleted: ${failed.join(",")}`
      : "Cleanup: all created offenders removed",
  );
});

// These scenarios share a single Delius account and drive the MPOP setup journey,
// so they must not run concurrently. The suite runs a single-worker which keeps them independent
// a failure in one test does not skip the other test

test.describe("Online check in for a new offender", () => {
  for (const scenario of scenarios) {
    test(`Create offender and setup online checkin and Completes a checkin when ${scenario.name} -> complete check in`, async ({
      page,
    }) => {
      const journey = new OnlineCheckinJourney(page);
      const offender = await journey.createOffenderAndSetupCheckins(
        firstCheckinDateString(scenario.firstCheckinDaysAhead),
      );
      const token = await getToken();
      const checkinUuid = await scenario.getCheckinUuid(offender, token);

      const details = await journey.completeCheckin(checkinUuid, offender);

      await journey.reviewCheckin(offender.crn, scenario.review, details);

      await journey.annotateCheckin(offender.crn, scenario.annotation);
    });
  }
});
