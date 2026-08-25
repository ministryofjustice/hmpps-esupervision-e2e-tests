import { expect, Page, test } from "@playwright/test";
import { env } from "../../config/env";
import { originPattern } from "./url";

/**
 * Selects which service a run targets and asserts it got it. One run, one service:
 * the check in flag is normally on, so runs target Manage Online Check Ins. Turn
 * the flag off and set LEGACY_MPOP=true to validate MPOP instead.
 *
 * TODO(legacy-mpop): Delete this whole file when legacy MPOP is retired, along
 * with every `assertExpectedService(...)` call site (grep for it - 8 at time of
 * writing) and the `if (LEGACY_MPOP)` branches listed in the README.
 * KEEP ./manageCheckinsPage.ts - those are MOCI's own assertions, not legacy.
 */

/** True when this run targets legacy MPOP instead of Manage Online Check Ins. */
export const LEGACY_MPOP = process.env.LEGACY_MPOP === "true";

const serviceOrigin = (): RegExp =>
  originPattern(LEGACY_MPOP ? env.mpopUrl() : env.manageCheckinsUiUrl());

/**
 * Fail fast at a hand-off if the other service answered, which means the flag and
 * LEGACY_MPOP disagree.
 *
 * Waits for the URL rather than reading it: a click resolves when it is dispatched,
 * not when its redirect has landed, so page.url() here would race the navigation.
 */
export async function assertExpectedService(
  page: Page,
  step: string,
): Promise<void> {
  const expected = LEGACY_MPOP ? "MPOP" : "Manage Online Check Ins";

  test.info().annotations.push({
    type: "service",
    description: `${step} -> ${expected}`,
  });

  await expect(
    page,
    `${step} should be served by ${expected}. ` +
      `Enable the check in feature flag, or run with LEGACY_MPOP=true to target MPOP.`,
  ).toHaveURL(serviceOrigin());
}
