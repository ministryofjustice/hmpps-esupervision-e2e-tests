import { expect, test } from "@playwright/test";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import ManageCheckInsJourney from "../../support/journeys/manage-online-checkins-ui/manageCheckinsJourney";
import { ManageCheckinsPages } from "../../support/pages/manage-online-checkins-ui/manageCheckinsPages";
import { FrequencyOptions } from "../../support/pages/manage-online-checkins-ui/checkInFrequencyPage";
import { getToken } from "../../api/auth";
import { listOffenderCheckins } from "../../api/checkin";
import { getOffenderByCrn } from "../../api/offender";
import { env } from "../../config/env";
import { waitForAwaitingCheckinUuid } from "../../support/utils/waitForCheckin";
import {
  displayedCheckinDatePattern,
  firstCheckinDateString,
} from "../../support/utils/date";

test.describe("Changing check in frequency from the manage page", () => {
  test("practitioner changes recurring check ins to ad hoc and back to recurring", async ({
    page,
  }) => {
    const offender = await new OnlineCheckinJourney(
      page,
    ).createOffenderAndSetupCheckins(firstCheckinDateString(7));
    const moci = new ManageCheckinsPages(page);
    const manage = await new ManageCheckInsJourney(page).openManage(
      offender.crn,
    );

    await test.step("Recurring check ins have no Schedule a check in button", async () => {
      await expect(manage.settingsFrequency()).toContainText("Every week");
      await expect(manage.scheduleCheckInButton()).toBeHidden();
    });

    await test.step("Recurring to ad hoc saves without asking for a date", async () => {
      await manage.clickChangeFrequency();
      await moci.checkinFrequency.assertOnPage();
      await moci.checkinFrequency.completePage(FrequencyOptions.AD_HOC);
      await manage.assertOnPage();
      await expect(manage.settingsFrequency()).toHaveText(
        "I'll schedule them one at a time",
      );
      await expect(
        manage.settingsNextCheckinDate(),
        "The future check in is removed",
      ).toHaveCount(0);
      await expect(manage.scheduleCheckInButton()).toBeVisible();
    });

    await test.step("Ad hoc to recurring asks for a new date, with none filled in", async () => {
      await manage.clickChangeFrequency();
      await moci.checkinFrequency.assertOnPage();
      await moci.checkinFrequency.completePage(FrequencyOptions.EVERY_2_WEEKS);
      await moci.checkinDate.assertOnPage();
      await expect(moci.checkinDate.dateInput()).toHaveValue("");
      await moci.checkinDate.completePage(firstCheckinDateString(14));
      await manage.assertOnPage();
      await expect(manage.settingsFrequency()).toContainText("Every 2 weeks");
      await expect(manage.settingsNextCheckinDate()).toContainText(
        displayedCheckinDatePattern(14),
      );
      await expect(manage.scheduleCheckInButton()).toBeHidden();
    });
  });

  test("practitioner changes recurring frequency while today's check in is active", async ({
    page,
  }) => {
    const offender = await new OnlineCheckinJourney(
      page,
    ).createOffenderAndSetupCheckins(firstCheckinDateString(0));
    const token = await getToken();
    await waitForAwaitingCheckinUuid(offender.crn, token);

    // The journey checks the change saves straight back to the manage page,
    // so no date page is asked for.
    const manageJourney = new ManageCheckInsJourney(page);
    await manageJourney.changeCheckInSettings(offender.crn, {
      frequency: FrequencyOptions.EVERY_2_WEEKS,
    });

    const manage = await manageJourney.openManage(offender.crn);
    await expect(manage.settingsFrequency()).toContainText("Every 2 weeks");
    await expect(
      manage.settingsNextCheckinDate(),
      "The new frequency runs from today's check in",
    ).toContainText(displayedCheckinDatePattern(0));
    await expect(
      manage.changeNextCheckinDateLink(),
      "An active check in cannot be moved",
    ).toHaveCount(0);

    const { uuid } = await getOffenderByCrn(offender.crn, token);
    const awaiting = await listOffenderCheckins(
      env.practitionerName(),
      uuid,
      token,
      "AWAITING_CHECKIN",
    );
    expect(
      awaiting,
      "Changing frequency should not create a second check in for today",
    ).toHaveLength(1);
  });
});
