import { expect, Locator, Page } from "@playwright/test";
import { env } from "../../config/env";
import { LEGACY_MPOP } from "./legacyMpop";
import { urlPattern } from "./url";

/**
 * Follows the link and checks it ends up in MPOP. Matches the start of the path.
 * `landedOn` asserts the page MPOP rendered there.
 *
 * TODO(legacy-mpop): Delete the LEGACY_MPOP early return below, and the import
 * above, when legacy MPOP is removed - on the legacy path the practitioner
 * never left MPOP, so there is no hand off to follow.
 */
export async function followToMpop(
  page: Page,
  link: Locator,
  name: string,
  path: string,
  landedOn?: () => Promise<void>,
): Promise<void> {
  if (LEGACY_MPOP) return;
  await expect(link, `${name} should be on the page`).toBeVisible();
  await link.click();
  await expect(page, `${name} should land in MPOP at ${path}`).toHaveURL(
    urlPattern(env.mpopUrl(), path),
  );
  await landedOn?.();
}
