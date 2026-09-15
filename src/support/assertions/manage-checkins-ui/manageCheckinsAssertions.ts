import { expect, Page } from "@playwright/test";
import { LEGACY_MPOP } from "../../utils/legacyMpop";
import { assertManageOnlineCheckinsUiTitle } from "../../utils/pageTitle";
import { assertCaseBanner } from "../../utils/caseBanner";
import { MissedCheckinReview } from "../../../data/models";
import ReviewedMissedCheckinPage from "../../pages/mpop/reviewedMissedCheckinPage";
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

export const assertMissedCheckinReviewed = async (
  page: Page,
  { note, sensitive = false }: MissedCheckinReview,
): Promise<void> => {
  const reviewed = new ReviewedMissedCheckinPage(page);
  const reason = note.trim();

  await expect(
    reviewed.reviewSummary(),
    `Reviewed page should show the reason "${reason}"`,
  ).toContainText(reason);

  // The tag is the only place the sensitivity answer shows, so assert it both ways.
  await expect(
    reviewed.sensitiveTag(),
    sensitive
      ? "A review marked sensitive should show the Sensitive tag"
      : "A review not marked sensitive should not show the Sensitive tag",
  ).toHaveCount(sensitive ? 1 : 0);
};
