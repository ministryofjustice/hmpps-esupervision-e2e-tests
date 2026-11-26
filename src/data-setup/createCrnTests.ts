import { Page, test } from "@playwright/test";

/**
 * Declares CRN_COUNT setup tests (default 1), each creating one CRN with
 * `create` and printing `<label> CRN ready: <CRN>`.
 */
export function createCrnTests(
  label: string,
  create: (page: Page) => Promise<{ crn: string }>,
): void {
  const count = Number(process.env.CRN_COUNT ?? "1");
  for (let i = 1; i <= count; i++) {
    test(`create ${label} CRN ${i} of ${count}`, async ({ page }) => {
      const { crn } = await create(page);
      test.info().annotations.push({ type: "crn", description: crn });
      console.log(`\n${label} CRN ready: ${crn}\n`);
    });
  }
}
