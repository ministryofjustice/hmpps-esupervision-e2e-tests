import test, { Page } from "@playwright/test";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import { MpopPages } from "../../support/pages/mpop/mpopPages";
import { env } from "../../config/env";

const startEligibility = async (page: Page): Promise<MpopPages> => {
  const crn = env.mpopTestCrn();
  const pages = new MpopPages(page);
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(crn);
  await pages.eligibility.assertOnPage();
  return pages;
};

test("eligibility answer leads to the NOT ELIGIBLE outcome", async ({
  page,
}) => {
  const pages = await startEligibility(page);
  await pages.eligibility.completePage([8]);
  await pages.ineligible.assertOnPage();
});

test("eligibility answer leads to the PARTIALLY ELIGIBLE outcome", async ({
  page,
}) => {
  const pages = await startEligibility(page);
  await pages.eligibility.completePage([0, 2, 4]);
  await pages.partiallyEligible.assertOnPage();
});
