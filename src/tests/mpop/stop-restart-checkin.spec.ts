import test, { expect } from "@playwright/test";
import { env } from "../../config/env";
import ManageCheckInsJourney from "../../support/journeys/mpop/manageCheckinsJourney";
import { MpopPages } from "../../support/pages/mpop/mpopPages";
import {
  displayedCheckinDatePattern,
  firstCheckinDateString,
} from "../../support/utils/date";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import { getOffenderByCrn } from "../../api/offender";
import { ensureActiveCheckin } from "../../support/utils/activeCheckin";
import { Preference } from "../../data/models";
import { LEGACY_MPOP } from "../../support/utils/legacyMpop";
import { followToMpop } from "../../support/utils/mpopHandoff";
import { absoluteUrl, urlPattern } from "../../support/utils/url";
import { MPOP_PATH } from "../../support/assertions/manage-checkins-ui/mpopHandoffAssertions";

// Sole owner of TEST_MPOP_STOP_RESTART_CRN. Serial because stop -> INACTIVE is
// the precondition for restart -> VERIFIED, which leaves the CRN as it started.
test.describe.configure({ mode: "serial" });

test.describe("stop then restart online check ins (existing CRN)", () => {
  const crn = env.mpopStopRestartCrn();
  let token: string;

  test.beforeAll(async () => {
    token = await ensureActiveCheckin(crn);
  });

  test("practitioner stops online check ins for a set up offender -> offender becomes INACTIVE", async ({
    page,
  }) => {
    const journey = new ManageCheckInsJourney(page);
    await journey.login();
    await journey.stopCheckIns(crn, "E2E test stop");
    await expect
      .poll(async () => (await getOffenderByCrn(crn, token)).status)
      .toBe("INACTIVE");
  });

  // TODO(legacy-mpop): drop the skip - legacy MPOP renders the page instead.
  test("Stop page for a stopped offender redirects to MPOP", async ({
    page,
  }) => {
    test.skip(LEGACY_MPOP, "Legacy MPOP renders the stop page itself");

    await new ManageCheckInsJourney(page).login();
    const { uuid } = await getOffenderByCrn(crn, token);
    // This service mirrors MPOP's check in paths, so MPOP_PATH builds its URLs too.
    await page.goto(
      absoluteUrl(
        env.manageCheckinsUiUrl(),
        `${MPOP_PATH.manageCheckin(crn, uuid)}/stop-checkin`,
      ),
    );
    await expect(
      page,
      "Stop page should redirect a stopped offender to their record in MPOP",
    ).toHaveURL(urlPattern(env.mpopUrl(), MPOP_PATH.overview(crn)));
  });

  test("practitioner restarts online check ins for the stopped offender -> offender returns to VERIFIED", async ({
    page,
  }) => {
    const journey = new ManageCheckInsJourney(page);
    await journey.login();
    await journey.restartCheckIns(crn, {
      date: firstCheckinDateString(7),
      frequency: FrequencyOptions.EVERY_8_WEEKS,
      preference: Preference.EMAIL,
    });
    // The confirmation page only exists right after restart, so the link is
    // followed here rather than in the link-only test below.
    await journey.assertRestartConfirmationLinksLandInMpop(crn);
    await expect
      .poll(async () => (await getOffenderByCrn(crn, token)).status)
      .toBe("VERIFIED");

    // VERIFIED alone would pass if restart ignored the schedule, so read it back
    // off the manage page - in the display format that page renders.
    const manage = await journey.openManage(crn);
    await expect(
      manage.settingsNextCheckinDate(),
      "Restart should save the first check in date that was entered",
    ).toContainText(displayedCheckinDatePattern(7));
    await expect(
      manage.settingsFrequency(),
      "Restart should save the frequency that was selected",
    ).toContainText("Every 8 weeks");
  });

  // Link-only test, doesn't submit anything, so it runs last and leaves the CRN
  // as restart left it.
  test("manage and stop check ins pages link back to MPOP", async ({
    page,
  }) => {
    const journey = new ManageCheckInsJourney(page);
    const pages = new MpopPages(page);
    await journey.login();

    const manage = await journey.openManage(crn);
    await journey.assertManageBackLink(crn);

    await journey.goToStopCheckIns(crn);
    await journey.assertStopPageLinks(crn);

    await followToMpop(
      page,
      manage.backLink(),
      "Back on the manage check ins page",
      MPOP_PATH.overview(crn),
      () => pages.overview.assertOnPage(),
    );
  });
});
