import type { Page } from "@playwright/test";

// Wipes a submitted field so it can't leak into a later failure's aria snapshot; a no-op if the page already navigated away.
export const clearSecretField = async (
  page: Page,
  selector: string,
): Promise<void> => {
  await page.fill(selector, "", { timeout: 1000 }).catch(() => {});
};
