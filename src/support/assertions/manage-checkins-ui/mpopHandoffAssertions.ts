import { expect, Locator, Page } from "@playwright/test";
import { env } from "../../../config/env";
import { LEGACY_MPOP } from "../../utils/legacyMpop";
import { urlPattern } from "../../utils/url";

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

/** The link points at MPOP. Only works for the ones built from MPOP's URL. */
export const assertHrefIsMpop = async (
  link: Locator,
  name: string,
  path: string,
): Promise<void> => {
  if (LEGACY_MPOP) return;
  await expect(link, `${name} should point at MPOP`).toHaveAttribute(
    "href",
    urlPattern(env.mpopUrl(), path),
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

/**
 * Follows the link and checks it ends up in MPOP. Matches the start of the path.
 * `landedOn` asserts the page MPOP rendered there.
 */
export const assertLandsInMpop = async (
  page: Page,
  link: Locator,
  name: string,
  path: string,
  landedOn?: () => Promise<void>,
): Promise<void> => {
  if (LEGACY_MPOP) return;
  await expect(link, `${name} should be on the page`).toBeVisible();
  await link.click();
  await expect(page, `${name} should land in MPOP at ${path}`).toHaveURL(
    urlPattern(env.mpopUrl(), path),
  );
  await landedOn?.();
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
  ).toHaveURL(urlPattern(env.mpopUrl(), `/case/${crn}/activity-log`));
};
