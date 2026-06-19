import { firstCheckinDateString } from "../../support/utils/date";
import { getToken } from "../../api/auth";
import { test } from "@playwright/test";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import { waitForAwaitingCheckinUuid } from "../../support/utils/waitForCheckin";

test("New offender -> set up online check in and first checkin today-> complete check in", async ({
  page,
}) => {
  const journey = new OnlineCheckinJourney(page);
  const offender = await journey.createOffenderAndSetupCheckins(
    firstCheckinDateString(0),
  );
  const token = await getToken();
  const checkinUuid = await waitForAwaitingCheckinUuid(offender.crn, token);
  await journey.completeCheckin(checkinUuid, offender);
});
