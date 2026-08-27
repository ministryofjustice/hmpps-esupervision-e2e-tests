import { Page } from "@playwright/test";
import { LEGACY_MPOP } from "../../utils/legacyMpop";
import { assertManageOnlineCheckinsUiTitle } from "../../utils/pageTitle";
import { assertCaseBanner } from "../../utils/caseBanner";
/**
 * Assert the page title and case banner that only Manage Online Check Ins renders
 */
export const assertManageCheckinsPage = async (
  page: Page,
  crn: string,
  title: string,
): Promise<void> => {
  // TODO(legacy-mpop): Delete this early return and the LEGACY_MPOP import above
  // when legacy MPOP is removed. Legacy MPOP renders neither the title nor the
  // case banner, so there is nothing to assert on that path.
  if (LEGACY_MPOP) return;
  await assertManageOnlineCheckinsUiTitle(page, title);
  await assertCaseBanner(page, crn);
};
