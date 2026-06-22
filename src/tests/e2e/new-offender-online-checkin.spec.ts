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

interface CheckinScenario {
  name: string;
  firstCheckinDaysAhead: number;
  getCheckinUuid: (offender: NewOffender, token: string) => Promise<string>;
}

const scenarios: CheckinScenario[] = [
  {
    name: "checkin created by the scheduler - first checkin today",
    firstCheckinDaysAhead: 0,
    getCheckinUuid: (offender, token) =>
      waitForAwaitingCheckinUuid(offender.crn, token),
  },
  {
    name: "checkin created via API - first check in date in the future",
    firstCheckinDaysAhead: 4,
    getCheckinUuid: (offender, token) =>
      createEsupervisionCheckin(offender.crn, dueDateString(today), token),
  },
];

// These scenarios share a single delius account and drive the setup MPOP journey, so they must
// not concurrently. The suite run s a single- worker which keep them independent
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
      await journey.completeCheckin(checkinUuid, offender);
    });
  }
});
