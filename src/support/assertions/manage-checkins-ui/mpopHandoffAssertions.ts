import { expect, Locator, Page } from "@playwright/test";
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
 * TODO(legacy-mpop): Delete the LEGACY_MPOP early returns below, and the import
 * above, when legacy MPOP is removed. These links are built by Manage Online
 * Check Ins - on the legacy path the practitioner never left MPOP, so there is
 * no hand off to check.
 */

/** Every path in MPOP that this service hands practitioners off to. Declared
 *  once so a destination isn't repeated as a literal at each call site. */
export const MPOP_PATH = {
  overview: (crn: string) => `/case/${crn}`,
  allCases: "/case/",
  activityLog: (crn: string) => `/case/${crn}/activity-log`,
  manage: (crn: string) => `/case/${crn}/appointments/check-in/manage/`,
} as const;

/** The link points at exactly this path in MPOP. Only works for the ones built
 *  from MPOP's URL. */
export const assertHrefIsMpop = async (
  link: Locator,
  name: string,
  path: string,
): Promise<void> => {
  if (LEGACY_MPOP) return;
  await expect(link, `${name} should point at MPOP`).toHaveAttribute(
    "href",
    absoluteUrl(env.mpopUrl(), path),
  );
};

/**
 * The link points into MPOP at or below this path. For routes whose href carries
 * an id the test does not know - only MPOP_PATH.manage, where the check in UUID
 * is appended. Prefer assertHrefIsMpop everywhere else: a prefix of
 * `/case/{crn}` also matches every page nested under it.
 */
export const assertHrefStartsWithMpop = async (
  link: Locator,
  name: string,
  path: string,
): Promise<void> => {
  if (LEGACY_MPOP) return;
  await expect(
    link,
    `${name} should point into MPOP at ${path}`,
  ).toHaveAttribute("href", urlPattern(env.mpopUrl(), path));
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
  if (LEGACY_MPOP) return;
  await expect(
    page,
    `Filing the review should return to ${crn}'s activity log in MPOP`,
  ).toHaveURL(urlPattern(env.mpopUrl(), MPOP_PATH.activityLog(crn)));
};
