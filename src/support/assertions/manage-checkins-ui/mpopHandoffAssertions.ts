import { expect, Locator, Page, test } from "@playwright/test";
import { env } from "../../../config/env";
import { LEGACY_MPOP } from "../../utils/legacyMpop";
import { absoluteUrl, urlPattern } from "../../utils/url";

/**
 * Checks on links that take a practitioner back to MPOP.
 *
 * Some pages link straight to MPOP's URL, so the hand off is in the href. Others
 * link to "/case/{crn}", which this service does not serve and redirects out -
 * only following those proves anything.
 *
 * TODO(legacy-mpop): Delete skipOnLegacy and its call sites below, and the two
 * imports above, when legacy MPOP is removed. These links are built by Manage
 * Online Check Ins - on the legacy path the practitioner never left MPOP, so
 * there is no hand off to check.
 */

/**
 * True on the legacy path, where the caller should skip. Annotates the test so a
 * skipped hand-off check shows up in the report rather than passing silently.
 */
const skipOnLegacy = (name: string): boolean => {
  if (!LEGACY_MPOP) return false;
  test.info().annotations.push({
    type: "skipped-on-legacy-mpop",
    description: `${name}: MPOP builds this link itself, so there is no hand off`,
  });
  return true;
};

/** Every path in MPOP that this service hands practitioners off to. Declared
 *  once so a destination isn't repeated as a literal at each call site. */
export const MPOP_PATH = {
  overview: (crn: string) => `/case/${crn}`,
  /** Same destination either way, but the setup confirmation renders it as an
   *  absolute MPOP URL and the restart confirmation as a relative href - so
   *  assert with assertHrefIsMpop and assertHrefIs respectively. */
  allCases: "/case/",
  activityLog: (crn: string) => `/case/${crn}/activity-log`,
  /** An offender's manage page. `uuid` is the offender's own uuid - the manage
   *  routes' id param is that same value - which a test gets from the API or off
   *  the current URL, see offenderUuidFrom. */
  manageCheckin: (crn: string, uuid: string) =>
    `/case/${crn}/appointments/check-in/manage/${uuid}`,
} as const;

/** The link points at exactly this path in MPOP. Only works for the ones built
 *  from MPOP's URL. */
export const assertHrefIsMpop = async (
  link: Locator,
  name: string,
  path: string,
): Promise<void> => {
  if (skipOnLegacy(name)) return;
  await expect(link, `${name} should point at MPOP`).toHaveAttribute(
    "href",
    absoluteUrl(env.mpopUrl(), path),
  );
};

/** Checks the link's href matches a relative path. */
export const assertHrefIs = async (
  link: Locator,
  name: string,
  path: string,
): Promise<void> => {
  await expect(link, `${name} should link to ${path}`).toHaveAttribute(
    "href",
    path,
  );
};

/** Filing a review is a redirect, not a link, so check the URL it lands on. */
export const assertReturnedToMpopActivityLog = async (
  page: Page,
  crn: string,
): Promise<void> => {
  if (skipOnLegacy("Filing the review returns to the activity log")) return;
  await expect(
    page,
    `Filing the review should return to ${crn}'s activity log in MPOP`,
  ).toHaveURL(urlPattern(env.mpopUrl(), MPOP_PATH.activityLog(crn)));
};
