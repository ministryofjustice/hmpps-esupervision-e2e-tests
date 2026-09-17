import { expect, Locator, Page, test } from "@playwright/test";
import { env } from "../../config/env";
import { LEGACY_MPOP } from "./legacyMpop";
import { urlPattern } from "./url";

/**
 * Follows the link and checks it ends up in MPOP. The URL match is a prefix, so
 * `landedOn` is required: it asserts the page MPOP actually rendered there.
 *
 * TODO(legacy-mpop): Delete the LEGACY_MPOP early return below, and the imports
 * above, when legacy MPOP is removed - on the legacy path the practitioner
 * never left MPOP, so there is no hand off to follow.
 */
export async function followToMpop(
  page: Page,
  link: Locator,
  name: string,
  path: string,
  landedOn: () => Promise<void>,
): Promise<void> {
  // Annotated rather than silent, so a skipped hand off shows in the report.
  if (LEGACY_MPOP) {
    test.info().annotations.push({
      type: "skipped-on-legacy-mpop",
      description: `${name}: MPOP serves this page itself, so there is no hand off`,
    });
    return;
  }
  await expect(link, `${name} should be on the page`).toBeVisible();
  await link.click();
  await expect(page, `${name} should land in MPOP at ${path}`).toHaveURL(
    urlPattern(env.mpopUrl(), path),
  );
  await landedOn();
}
