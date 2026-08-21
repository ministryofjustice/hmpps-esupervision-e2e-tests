import { expect, Page } from "@playwright/test";
import CaseBanner from "../pages/manage-checkins-ui/caseBanner";

export const assertCaseBanner = async (
  page: Page,
  crn: string,
): Promise<void> => {
  const banner = new CaseBanner(page);
  await expect(banner.crn(), `Case banner should show CRN ${crn}`).toHaveText(
    crn,
  );
  await expect(
    banner.tierLink(),
    "Case banner should show the case's tier",
  ).toBeVisible();
};
