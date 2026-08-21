import { Page } from "@playwright/test";
import OnlineCheckinJourney from "../journeys/e2e/onlineCheckinJourney";
import { loginToMpop } from "../pages/mpop/loginPage";
import { firstCheckinDateString } from "./date";
import { NewOffender } from "../../data/delius/types";

// Lazily created once per test process and reused by every spec that calls this -
// avoids repeating the ~1-2 min NDelius + MPOP setup flow for specs that only need
// "some active, already-set-up check in to act on" and don't depend on each other's
// mutations. Falls back to one-per-worker if files land on separate workers.
let cachedMpop: Promise<NewOffender> | undefined;
let cachedNewUi: Promise<NewOffender> | undefined;
const createdOnPage = new Set<Page>();

export const getSharedActiveCheckinOffender = (
  page: Page,
): Promise<NewOffender> => {
  if (!cachedMpop) {
    createdOnPage.add(page);
    cachedMpop = new OnlineCheckinJourney(page).createOffenderAndSetupCheckins(
      firstCheckinDateString(7),
    );
  }
  return cachedMpop;
};

// A separate offender from getSharedActiveCheckinOffender(), pinned to
// manage-checkins-ui at setup time so the manage-checkins-ui specs' shared
// fixture stays independent of the MPOP-only specs' one - a mutation or
// failure in either suite can't destabilise the other.
export const getSharedNewUiCheckinOffender = (
  page: Page,
): Promise<NewOffender> => {
  if (!cachedNewUi) {
    createdOnPage.add(page);
    cachedNewUi = new OnlineCheckinJourney(page).createOffenderAndSetupCheckins(
      firstCheckinDateString(7),
      "newUi",
    );
  }
  return cachedNewUi;
};

// createOffenderAndSetupCheckins already logs the creating page into MPOP as
// part of the setup wizard - logging in again on that same page fails, since
// it lands straight on the search page instead of the sign in page.
export const ensureMpopLogin = async (page: Page): Promise<void> => {
  if (createdOnPage.has(page)) return;
  await loginToMpop(page);
};
