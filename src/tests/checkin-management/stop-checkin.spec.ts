import test, { expect } from "@playwright/test";
import { getToken } from "../../api/auth";
import { getOffenderByCrn } from "../../api/offender";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import ManageCheckInsJourney from "../../support/journeys/mpop/manageCheckinsJourney";
import { firstCheckinDateString } from "../../support/utils/date";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import { ExpectedUi } from "../../support/utils/expectedUi";

// Remove the MPOP entry once stopping online check ins is fully migrated to
// manage-checkins-ui - the "new UI" entry alone will then cover this flow.
const UI_VARIANTS: { name: string; expectedUi?: ExpectedUi }[] = [
  { name: "MPOP" },
  { name: "new UI", expectedUi: "newUi" },
];

for (const variant of UI_VARIANTS) {
  test(`practitioner stops online check ins on ${variant.name} -> offender becomes INACTIVE`, async ({
    page,
  }, testInfo) => {
    // Dedicated offender, not a shared fixture: stopping deactivates the
    // check in schedule, which would break other specs relying on an active
    // check in.
    const offender = await new OnlineCheckinJourney(
      page,
    ).createOffenderAndSetupCheckins(
      firstCheckinDateString(7),
      variant.expectedUi,
    );
    await attachCreatedCrn(testInfo, offender.crn);

    const journey = new ManageCheckInsJourney(page);
    await journey.stopCheckIns(
      offender.crn,
      "No longer required",
      variant.expectedUi,
    );

    const token = await getToken();
    await expect
      .poll(async () => (await getOffenderByCrn(offender.crn, token))?.status)
      .toBe("INACTIVE");
  });
}
