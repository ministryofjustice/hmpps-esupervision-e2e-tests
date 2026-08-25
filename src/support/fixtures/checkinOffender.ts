import { Browser } from "@playwright/test";
import { NewOffender } from "../../data/delius/types";
import OnlineCheckinJourney from "../journeys/e2e/onlineCheckinJourney";
import { firstCheckinDateString } from "../utils/date";
import { recordCreatedCrn } from "../utils/createdCrns";

/**
 * Create an offender with active online check ins, owned by the calling spec, in
 * its own browser context so the test's `page` is untouched.
 *
 * Deliberately not shared: most consumers mutate the offender, so one shared
 * between specs would make them order dependent.
 *
 * The CRN is written to created-crns.txt as soon as the Delius record exists, not
 * when a test attaches it, so an offender created here is still cleaned up if the
 * check in setup fails afterwards.
 */
export const createCheckinOffender = async (
  browser: Browser,
): Promise<NewOffender> => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    return await new OnlineCheckinJourney(page).createOffenderAndSetupCheckins(
      firstCheckinDateString(7),
      recordCreatedCrn,
    );
  } finally {
    await context.close();
  }
};
