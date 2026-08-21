import { getToken } from "../../api/auth";
import { test } from "@playwright/test";
import { createEsupervisionCheckin } from "../../api/checkin";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import { IdentityDecision } from "../../support/pages/mpop/reviewIdentityPage";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import {
  dueDateString,
  firstCheckinDateString,
  today,
} from "../../support/utils/date";

// Unlike the other manage-checkins-ui specs (which reuse a shared offender
// for speed), this one exists purely to assert the full setup -> check in ->
// review -> annotate chain lands on the new UI at every step - decision
// outcome coverage (MATCH/NO_MATCH/MATCH_WITH_CONCERN) is already fully
// exercised by the UI-agnostic src/tests/e2e/new-offender-online-checkin.spec.ts.
test("new offender's full check in journey lands on new UI end to end", async ({
  page,
}, testInfo) => {
  const journey = new OnlineCheckinJourney(page);
  const offender = await journey.createOffenderAndSetupCheckins(
    firstCheckinDateString(4),
    "newUi",
  );
  await attachCreatedCrn(testInfo, offender.crn);

  const token = await getToken();
  const checkinUuid = await createEsupervisionCheckin(
    offender.crn,
    dueDateString(today),
    token,
  );
  const details = await journey.completeCheckin(checkinUuid, offender);

  await journey.reviewCheckin(
    offender.crn,
    {
      identity: IdentityDecision.MATCH,
      riskManagement: false,
      sensitive: false,
      note: "Identity confirmed, nothing concerning",
    },
    details,
    "newUi",
  );

  await journey.annotateCheckin(
    offender.crn,
    { note: "Reviewed, no further action", sensitive: false },
    "newUi",
  );
});
