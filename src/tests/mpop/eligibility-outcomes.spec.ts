import test, { Page } from "@playwright/test";
import { env } from "../../config/env";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import { MpopPages } from "../../support/pages/mpop/mpopPages";
import {
  assertRelativeHref,
  followToMpop,
  MPOP_PATH,
} from "../../support/assertions/manage-checkins-ui/mpopHandoff";
import { LEGACY_MPOP } from "../../support/utils/legacyMpop";

// Sole owner of TEST_MPOP_ELIGIBILITY_CRN. No test here completes setup, so
// starting the wizard again on the same CRN is safe - serial so a failure part
// way through the wizard doesn't leave the next test starting from that state.
test.describe.configure({ mode: "serial" });

/** Signs in, starts setup, and stops on the eligibility questions. */
const startEligibility = async (
  page: Page,
): Promise<{ pages: MpopPages; crn: string }> => {
  const crn = env.mpopEligibilityCrn();
  const pages = new MpopPages(page);
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(crn);
  await pages.eligibility.assertOnPage();
  return { pages, crn };
};

test("eligibility answer leads to the NOT ELIGIBLE outcome", async ({
  page,
}) => {
  const { pages } = await startEligibility(page);
  await pages.eligibility.completePage([8]);
  await pages.ineligible.assertOnPage();
});

test("eligibility answer leads to the PARTIALLY ELIGIBLE outcome", async ({
  page,
}) => {
  const { pages, crn } = await startEligibility(page);
  await pages.eligibility.completePage([0, 2, 4]);
  await pages.partiallyEligible.assertOnPage();
  await assertRelativeHref(
    pages.partiallyEligible.cancelLink(),
    "Cancel and go back to the person's overview",
    MPOP_PATH.overview(crn),
  );
});

test("Cancel on the eligibility questions and eligible pages returns to the person in MPOP", async ({
  page,
}) => {
  test.skip(LEGACY_MPOP, "Links back to MPOP aren't tested on legacy");

  const { pages, crn } = await startEligibility(page);
  await assertRelativeHref(
    pages.eligibility.cancelLink(),
    "Cancel and go back",
    MPOP_PATH.overview(crn),
  );

  await pages.eligibility.completePage([9]);
  await pages.eligible.assertOnPage();
  await assertRelativeHref(
    pages.eligible.cancelLink(),
    "Cancel and go back to the person's overview",
    MPOP_PATH.overview(crn),
  );

  // Both pages point at the same relative path, which this service doesn't
  // serve - following one is enough to show the redirect out to MPOP works.
  await followToMpop(
    page,
    pages.eligible.cancelLink(),
    "Cancel and go back to the person's overview",
    MPOP_PATH.overview(crn),
    () => pages.overview.assertOnPage(),
  );
});
