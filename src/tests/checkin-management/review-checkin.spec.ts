import { getToken } from "../../api/auth";
import test, { Page } from "@playwright/test";
import { createEsupervisionCheckin } from "../../api/checkin";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import ReviewCheckinJourney from "../../support/journeys/mpop/reviewCheckinJourney";
import { IdentityDecision } from "../../support/pages/mpop/reviewIdentityPage";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import {
  ensureMpopLogin,
  getSharedActiveCheckinOffender,
  getSharedNewUiCheckinOffender,
} from "../../support/utils/sharedActiveCheckinOffender";
import { dueDateString, today } from "../../support/utils/date";
import { NewOffender } from "../../data/delius/types";
import { ExpectedUi } from "../../support/utils/expectedUi";

// Remove the MPOP entry once check in review is fully migrated to
// manage-checkins-ui - the "new UI" entry alone will then cover this flow.
const UI_VARIANTS: {
  name: string;
  expectedUi?: ExpectedUi;
  getOffender: (page: Page) => Promise<NewOffender>;
}[] = [
  { name: "MPOP", getOffender: getSharedActiveCheckinOffender },
  {
    name: "new UI",
    expectedUi: "newUi",
    getOffender: getSharedNewUiCheckinOffender,
  },
];

for (const variant of UI_VARIANTS) {
  test(`practitioner reviews and annotates a completed check in on ${variant.name}`, async ({
    page,
  }, testInfo) => {
    const journey = new OnlineCheckinJourney(page);
    const offender = await variant.getOffender(page);
    await attachCreatedCrn(testInfo, offender.crn);

    const token = await getToken();
    const checkinUuid = await createEsupervisionCheckin(
      offender.crn,
      dueDateString(today),
      token,
    );
    const details = await journey.completeCheckin(checkinUuid, offender);

    await ensureMpopLogin(page);
    const review = new ReviewCheckinJourney(page);
    await review.reviewCompletedCheckin(
      offender.crn,
      {
        identity: IdentityDecision.MATCH,
        riskManagement: false,
        sensitive: false,
        note: "Identity confirmed, nothing concerning",
      },
      details,
      variant.expectedUi,
    );

    await review.annotateReviewedCheckin(
      offender.crn,
      {
        note: "Reviewed, no further action",
        sensitive: false,
      },
      variant.expectedUi,
    );
  });
}
