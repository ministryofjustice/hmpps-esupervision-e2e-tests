import test, { Page } from "@playwright/test";
import { env } from "../../config/env";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import { MpopPages } from "../../support/pages/mpop/mpopPages";
import {
  assertHrefIs,
  assertLandsInMpop,
} from "../../support/assertions/manage-checkins-ui/mpopHandoffAssertions";

// Sole owner of TEST_MPOP_ELIGIBILITY_CRN. No test here completes setup, so
// restarting it on the same CRN is safe - serial only to stop the tests racing
// the same wizard session.
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
    `/case/${crn}`,
  );
});

// Follows Cancel and checks it lands on the person's record in MPOP.
test("Cancel on the eligibility page returns to the person's record in MPOP", async ({
  page,
}) => {
  const { pages, crn } = await startEligibility(page);
  await assertLandsInMpop(
    page,
    pages.eligibility.cancelLink(),
    "Cancel and go back",
    `/case/${crn}`,
    () => pages.overview.assertOnPage(),
  );
});
