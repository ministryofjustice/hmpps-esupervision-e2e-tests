import { Browser } from "@playwright/test";
import { NewOffender } from "../../data/delius/types";
import OnlineCheckinJourney from "../journeys/e2e/onlineCheckinJourney";
import { firstCheckinDateString } from "../utils/date";

/**
 * Create an offender with active online check ins, owned by the calling spec, in
 * its own browser context so the test's `page` is untouched.
 *
 * Deliberately not shared: most consumers mutate the offender, so one shared
 * between specs would make them order dependent.
 */
export const createCheckinOffender = async (
  browser: Browser,
): Promise<NewOffender> => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    return await new OnlineCheckinJourney(page).createOffenderAndSetupCheckins(
      firstCheckinDateString(7),
    );
  } finally {
    await context.close();
  }
};
