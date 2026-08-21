import test, { expect } from "@playwright/test";
import ManageCheckInsJourney from "../../support/journeys/mpop/manageCheckinsJourney";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import { firstCheckinDateString } from "../../support/utils/date";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import {
  ensureMpopLogin,
  getSharedActiveCheckinOffender,
} from "../../support/utils/sharedActiveCheckinOffender";

test("practitioner changes the next check in date and frequency from the manage page", async ({
  page,
}, testInfo) => {
  const offender = await getSharedActiveCheckinOffender(page);
  await attachCreatedCrn(testInfo, offender.crn);

  await ensureMpopLogin(page);
  const journey = new ManageCheckInsJourney(page);
  const originalDate = (
    await (
      await journey.openManage(offender.crn)
    )
      .nextCheckinDate()
      .textContent()
  )?.trim();

  await journey.changeCheckInSettings(offender.crn, {
    date: firstCheckinDateString(14),
    frequency: FrequencyOptions.EVERY_4_WEEKS,
  });

  const manage = await journey.openManage(offender.crn);
  await expect(manage.nextCheckinDate()).not.toHaveText(originalDate ?? "");
});
