import { expect, Page } from "@playwright/test";
import { env } from "../../config/env";

export type ExpectedUi = "mpop" | "newUi";

export function isOnManageCheckinsUi(page: Page): boolean {
  return page.url().startsWith(env.manageCheckinsUiUrl());
}

// several journeys can redirect to either legacy MPOP or
// manage-checkins-ui depending on a feature flag - detect which domain the
// flow actually landed on, and, when a specific domain is expected (e.g. a
// spec deliberately toggled the flag), assert against it.
export function assertOnExpectedUi(
  page: Page,
  step: string,
  expectedUi?: ExpectedUi,
): boolean {
  const onNewUi = isOnManageCheckinsUi(page);
  if (expectedUi) {
    expect(
      onNewUi,
      `${step} should be on the ${expectedUi === "newUi" ? "manage-checkins-ui" : "MPOP"} UI`,
    ).toBe(expectedUi === "newUi");
  }
  return onNewUi;
}
