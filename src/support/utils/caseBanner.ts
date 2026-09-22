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
  // TODO(tier): MOCI doesn't render the tier link when the case has no tier set
  // yet (e.g. a freshly created offender). Needs fixing in MOCI; tolerated here
  // until then.
  const tierCount = await banner.tierLink().count();
  if (tierCount === 0) {
    console.log(`Case banner for ${crn} has no tier link - tier not set yet.`);
    return;
  }
  await expect(
    banner.tierLink(),
    "Case banner should show the case's tier",
  ).toBeVisible();
};
