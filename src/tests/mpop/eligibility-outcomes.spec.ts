import test, { Page } from "@playwright/test";
import { env } from "../../config/env";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import { MpopPages } from "../../support/pages/mpop/mpopPages";
import {
  assertHrefIs,
  MPOP_PATH,
} from "../../support/assertions/manage-checkins-ui/mpopHandoffAssertions";
import { followToMpop } from "../../support/utils/mpopHandoff";

// Sole owner of TEST_MPOP_ELIGIBILITY_CRN. No test here completes setup, so
// starting the wizard again on the same CRN is safe - serial so a failure part
// way through the wizard doesn't leave the next test starting from that state.
test.describe.configure({ mode: "serial" });

/** Opens the eligibility page and returns the pages with the CRN. */
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
  await assertHrefIs(
    pages.partiallyEligible.cancelLink(),
    "Cancel and go back to the person's overview",
    MPOP_PATH.overview(crn),
  );
});

test("eligibility and eligible pages' Cancel links go back to the person's overview in MPOP", async ({
  page,
}) => {
  const { pages, crn } = await startEligibility(page);
  await assertHrefIs(
    pages.eligibility.cancelLink(),
    "Cancel and go back",
    MPOP_PATH.overview(crn),
  );

  await pages.eligibility.completePage([9]);
  await pages.eligible.assertOnPage();
  await assertHrefIs(
    pages.eligible.cancelLink(),
    "Cancel and go back to the person's overview",
    MPOP_PATH.overview(crn),
  );

  // Both pages point at the same relative path, and this service doesn't serve
  // it - following one proves the redirect out to MPOP really happens. The href
  // assertions above are what this test still checks on the legacy path, where
  // followToMpop is a no-op because the practitioner never left MPOP.
  await followToMpop(
    page,
    pages.eligible.cancelLink(),
    "Cancel and go back to the person's overview",
    MPOP_PATH.overview(crn),
    () => pages.overview.assertOnPage(),
  );
});
