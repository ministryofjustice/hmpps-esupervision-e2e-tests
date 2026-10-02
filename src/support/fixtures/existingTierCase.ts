import { expect, Page, test } from "@playwright/test";
import { env } from "../../config/env";
import { ExistingTier } from "../../data/models";
import SetupOnlineCheckinsJourney from "../journeys/manage-online-checkins-ui/setupOnlineCheckinsJourney";
import { ManageCheckinsPages } from "../pages/manage-online-checkins-ui/manageCheckinsPages";
import { assertTierCrnPreconditions } from "../assertions/api/supervisionPackageAPI";
import { assertTier } from "../assertions/manage-online-checkins-ui/manageCheckinsAssertions";

/**
 * Opens setup for an existing CRN, after checking its supervision package and tier
 * haven't changed. Test using these CRNs never complete setup, so the CRN can be reused.
 */
export const openExistingTierSetup = async (
  page: Page,
  tier: ExistingTier,
): Promise<{ crn: string; moci: ManageCheckinsPages }> => {
  const crn = env.tierCrn(tier);
  await assertTierCrnPreconditions(crn, tier);
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(crn);
  await assertTier(page, crn, new RegExp(`Tier:\\s*${tier}(?:\\d+)?\\b`));
  const moci = new ManageCheckinsPages(page);
  await test.step(`Check eligibility questions for Tier ${tier}`, async () => {
    for (const question of ["accreditedProgramme", "youthSentence"] as const) {
      const checkbox = moci.eligibilityCheck.answerCheckbox(question);
      if (tier === "A" || tier === "B") {
        await expect(checkbox).toBeVisible();
      } else {
        await expect(checkbox).toHaveCount(0);
      }
    }
  });
  return { crn, moci };
};
