import { expect, Locator, Page, test } from "@playwright/test";
import { env } from "../../../config/env";
import { LEGACY_MPOP } from "../../utils/legacyMpop";
import { absoluteUrl, urlPattern } from "../../utils/url";

/**
 * Links that take a practitioner from Manage Online Check Ins back to MPOP.
 *
 * Two kinds. Some hold MPOP's full URL, so checking the href is enough. Others
 * are relative, like "/case/X123" - this service doesn't serve that, it
 * redirects out to MPOP, so those only prove anything if you follow them.
 *
 * None of this runs on legacy MPOP. There the practitioner never left MPOP, so
 * there is no hand off to test.
 *
 * TODO(legacy-mpop): delete noHandOffOnLegacy and its callers, and the two
 * imports above, when legacy MPOP goes.
 */

/**
 * True when the run is targeting legacy MPOP, so the caller should bail.
 *
 * Not test.skip - the test carries on and passes. The annotation is there so the
 * report says which check was dropped, rather than it vanishing quietly.
 *
 * Exported for callers that would otherwise navigate somewhere just to reach a
 * check that won't run. If a whole test would be left with nothing to assert,
 * use test.skip instead, so it shows as skipped rather than passed.
 */
export const noHandOffOnLegacy = (name: string): boolean => {
  if (!LEGACY_MPOP) return false;
  test.info().annotations.push({
    type: "no-handoff-on-legacy-mpop",
    description: `${name}: not checked on legacy MPOP - nothing hands off there`,
  });
  return true;
};

/** Where in MPOP this service sends people. Kept in one place so no test repeats
 *  a path as a literal. */
export const MPOP_PATH = {
  overview: (crn: string) => `/case/${crn}`,
  /** The case list. The setup confirmation links to it with MPOP's full URL, the
   *  restart confirmation with this relative path.
   *
   *  Written exactly as those pages render it, trailing slash and all, because
   *  the href checks compare the attribute character for character. If a page
   *  ever renders "/case" instead, change it here. Landing URLs are looser -
   *  urlPathPattern lets the slash go, since a redirect tidying a path isn't the
   *  link changing.
   *
   *  Nothing clicks the relative one: the click is spent on the record link,
   *  which is where a practitioner actually wants to go. So it's covered in two
   *  parts - the href here, and layout.spec walking the same path out to MPOP's
   *  case list. */
  allCases: "/case/",
  activityLog: (crn: string) => `/case/${crn}/activity-log`,
  /** An offender's manage page. The id in the URL is the offender's own uuid -
   *  take it from the API, or off the current URL with offenderUuidFrom. */
  manageCheckin: (crn: string, uuid: string) =>
    `/case/${crn}/appointments/check-in/manage/${uuid}`,
} as const;

/** The link holds MPOP's full URL. */
export const assertAbsoluteMpopHref = async (
  link: Locator,
  name: string,
  path: string,
): Promise<void> => {
  if (noHandOffOnLegacy(name)) return;
  await expect(link, `${name} should point at MPOP`).toHaveAttribute(
    "href",
    absoluteUrl(env.mpopUrl(), path),
  );
};

/** The link holds a relative path - one this service leaves to the browser and
 *  doesn't serve itself. */
export const assertRelativeHref = async (
  link: Locator,
  name: string,
  path: string,
): Promise<void> => {
  if (noHandOffOnLegacy(name)) return;
  await expect(link, `${name} should link to ${path}`).toHaveAttribute(
    "href",
    path,
  );
};

/**
 * Filing a review redirects rather than links, so check where it lands.
 *
 * Prefix match with landedOn behind it, the same as the Back link on the
 * reviewed check in page. Both go to the activity log, so both are checked the
 * same way.
 */
export const assertReturnedToMpopActivityLog = async (
  page: Page,
  crn: string,
  landedOn: () => Promise<void>,
): Promise<void> => {
  if (noHandOffOnLegacy("Filing the review returns to the activity log"))
    return;
  await expect(
    page,
    `Filing the review should return to ${crn}'s activity log in MPOP`,
  ).toHaveURL(urlPattern(env.mpopUrl(), MPOP_PATH.activityLog(crn)));
  await landedOn();
};

/**
 * Click the link and check it ends up in MPOP. The URL match is only a prefix,
 * so landedOn is required - it checks MPOP rendered the page we expected.
 */
export async function followToMpop(
  page: Page,
  link: Locator,
  name: string,
  path: string,
  landedOn: () => Promise<void>,
): Promise<void> {
  if (noHandOffOnLegacy(name)) return;
  await expect(link, `${name} should be on the page`).toBeVisible();
  await link.click();
  await expect(page, `${name} should land in MPOP at ${path}`).toHaveURL(
    urlPattern(env.mpopUrl(), path),
  );
  await landedOn();
}
