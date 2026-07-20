import { expect, Page } from "@playwright/test";
import { manageCheckinsUiTitle } from "../../data/manage-checkins-ui/layoutConstants";

export const assertManageOnlineCheckinsUiTitle = async (
  page: Page,
  pageTitleText: string,
): Promise<void> => {
  await expect(page).toHaveTitle(manageCheckinsUiTitle(pageTitleText));
};
