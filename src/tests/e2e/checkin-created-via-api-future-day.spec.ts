import test from "@playwright/test";
import { getToken } from "../../api/auth";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import {
  dueDateString,
  firstCheckinDateString,
  today,
} from "../../support/utils/date";
import { createEsupervisionCheckin } from "../../api/checkin";

test("New offender -> set up online check in -> create check in via API -> complete check in", async ({
  page,
}) => {
  test.slow();
  const journey = new OnlineCheckinJourney(page);
  const offender = await journey.createOffenderAndSetupCheckins(
    firstCheckinDateString(4),
  );
  const token = await getToken();
  const checkinUuid = await createEsupervisionCheckin(
    offender.crn,
    dueDateString(today),
    token,
  );
  await journey.completeCheckin(checkinUuid, offender);
});
