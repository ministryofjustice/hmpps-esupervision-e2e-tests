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
import { absoluteUrl, urlPattern } from "../../support/utils/url";
import {
  followToMpop,
  MPOP_PATH,
} from "../../support/assertions/manage-checkins-ui/mpopHandoff";

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

  // TODO(legacy-mpop): drop the skip - legacy MPOP renders this page itself.
  test("Stop page sends you back to MPOP if check ins are already stopped", async ({
    page,
  }) => {
    test.skip(LEGACY_MPOP, "Legacy MPOP renders the stop page itself");

    await new ManageCheckInsJourney(page).login();
    const { uuid } = await getOffenderByCrn(crn, token);
    // This service uses the same check in paths as MPOP, so MPOP_PATH builds
    // its URLs too.
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
    // Prefix match above, so check the page as well - same rule followToMpop
    // uses. Not urlPathPattern: MPOP can add a sub-path to its own overview
    // whenever it likes, and this test is about leaving, not about that URL.
    await new MpopPages(page).overview.assertOnPage();
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
    // The confirmation page only exists right after a restart, so the links are
    // checked here rather than in the link test below.
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

  // Nothing here submits anything, so it runs last and leaves the CRN as the
  // restart above left it.
  test("Back and Cancel on the manage and stop check ins pages return to MPOP", async ({
    page,
  }) => {
    test.skip(LEGACY_MPOP, "Links back to MPOP aren't tested on legacy");

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
