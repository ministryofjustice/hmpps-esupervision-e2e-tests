import test, { Page, TestInfo } from "@playwright/test";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import DeliusOffenderJourney from "../../support/journeys/ndelius/deliusOffenderJourney";
import { MpopPages } from "../../support/pages/mpop/mpopPages";
import { attachCreatedCrn } from "../../support/utils/createdCrns";

// Own offender per test, not a shared CRN
const startEligibility = async (
  page: Page,
  testInfo: TestInfo,
): Promise<MpopPages> => {
  const offender = await new DeliusOffenderJourney(page).createTestOffender();
  await attachCreatedCrn(testInfo, offender.crn);

  const pages = new MpopPages(page);
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(offender.crn);
  await pages.eligibility.assertOnPage();
  return pages;
};

test("eligibility answer leads to the NOT ELIGIBLE outcome", async ({
  page,
}, testInfo) => {
  const pages = await startEligibility(page, testInfo);
  await pages.eligibility.completePage([8]);
  await pages.ineligible.assertOnPage();
});

test("eligibility answer leads to the PARTIALLY ELIGIBLE outcome", async ({
  page,
}, testInfo) => {
  const pages = await startEligibility(page, testInfo);
  await pages.eligibility.completePage([0, 2, 4]);
  await pages.partiallyEligible.assertOnPage();
});
