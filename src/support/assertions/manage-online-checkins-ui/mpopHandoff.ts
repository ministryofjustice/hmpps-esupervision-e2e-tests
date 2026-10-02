import { expect, Locator, Page } from "@playwright/test";
import { env } from "../../../config/env";
import { absoluteUrl, urlPattern } from "../../utils/url";

/**
 * Assertions for links that hand a practitioner back to MPOP from Manage
 * Online Check Ins.
 */

/** Where in MPOP this service sends people. Kept in one place so no test repeats
 *  a path as a literal. */
export const MPOP_PATH = {
  overview: (crn: string) => `/case/${crn}`,
  /** The case list. Some links hold this as an absolute MPOP URL, others as a
   *  relative path.
   *
   *  Written exactly as those pages render it, trailing slash and all, because
   *  the href checks compare the attribute character for character. If a page
   *  ever renders "/case" instead, change it here. Landing URLs are looser -
   *  urlPathPattern lets the slash go, since a redirect tidying a path isn't the
   *  link changing. */
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
  await expect(link, `${name} should link to ${path}`).toHaveAttribute(
    "href",
    path,
  );
};

/**
 * Filing a review redirects rather than links, so check where it lands.
 * The URL match is only a prefix, so landedOn confirms MPOP actually rendered
 * the activity log.
 */
export const assertReturnedToMpopActivityLog = async (
  page: Page,
  crn: string,
  landedOn: () => Promise<void>,
): Promise<void> => {
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
  await expect(link, `${name} should be on the page`).toBeVisible();
  await link.click();
  await expect(page, `${name} should land in MPOP at ${path}`).toHaveURL(
    urlPattern(env.mpopUrl(), path),
  );
  await landedOn();
}
