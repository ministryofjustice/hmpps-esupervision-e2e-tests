import { expect, Page } from "@playwright/test";
import CaseBanner from "../../pages/manage-online-checkins-ui/caseBanner";
import { manageCheckinsUiTitle } from "../../../data/manage-online-checkins-ui/pageTitles";

/**
 * Assert the page title and case banner rendered by Manage Online Check Ins.
 */
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

export const assertManageCheckinsPage = async (
  page: Page,
  crn: string,
  title: string,
): Promise<void> => {
  await assertManageOnlineCheckinsUiTitle(page, title);
  await assertCaseBanner(page, crn);
};

export const assertManageOnlineCheckinsUiTitle = async (
  page: Page,
  pageTitleText: string,
): Promise<void> => {
  await expect(page).toHaveTitle(manageCheckinsUiTitle(pageTitleText));
};

export const assertTier = async (
  page: Page,
  crn: string,
  expected: RegExp,
): Promise<void> => {
  await expect(
    new CaseBanner(page).tierLink(),
    `CRN ${crn} should have a tier matching ${expected}`,
  ).toHaveText(expected);
};
