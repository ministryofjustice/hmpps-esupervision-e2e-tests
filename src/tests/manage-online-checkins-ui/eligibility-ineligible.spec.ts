import test, { expect, type Page } from "@playwright/test";
import { env } from "../../config/env";
import {
  IS_ELIGIBLE_TITLE,
  NOT_ELIGIBLE_TITLE,
} from "../../data/manage-online-checkins-ui/pageTitles";
import {
  assertManageCheckinsPage,
  assertTier,
} from "../../support/assertions/manage-online-checkins-ui/manageCheckinsAssertions";
import {
  assertPackageEligibility,
  assertTierHeader,
} from "../../support/assertions/api/supervisionPackageAPI";
import {
  assertRelativeHref,
  MPOP_PATH,
} from "../../support/assertions/manage-online-checkins-ui/mpopHandoff";
import DeliusOffenderJourney from "../../support/journeys/ndelius/deliusOffenderJourney";
import { checkEligibility } from "../../api/eligibility";
import { getToken } from "../../api/auth";
import {
  assertEligibility,
  requirePilotPractitioner,
  resetPilotCase,
} from "../../support/assertions/api/eligibilityAPI";
import { openExistingTierSetup } from "../../support/fixtures/existingTierCase";
import SetupOnlineCheckinsJourney from "../../support/journeys/manage-online-checkins-ui/setupOnlineCheckinsJourney";
import { ManageCheckinsPages } from "../../support/pages/manage-online-checkins-ui/manageCheckinsPages";
import {
  NO_TIER_REASON,
  NO_ACTIVE_SENTENCE_REASON,
  NO_PACKAGE_REASON,
  FINAL_THIRD_REASON,
  NO_ACTIVE_SENTENCE_MOCI_REASON,
  IN_RESET_REASON,
  RECALLED_REASON,
  PROVISIONAL_TIER_REASON,
  PROVISIONAL_TIER_MOCI_REASON,
  UNALLOCATED_REASON,
  DEVICE_RESTRICTION_REASON,
  YOUTH_ON_PROGRAMME_REASON,
  TIER_C_REASON,
  NOT_ON_PROGRAMME_REASON,
} from "../../data/manage-online-checkins-ui/eligibilityReasons";
test.skip(
  !env.eligibilityEndpoint(),
  "Needs MOCI's useEligibilityEndpoint flag on",
);
test.afterEach(resetPilotCase);

/** Opens setup from MPOP for a person ruled out on data: checks the card, then MOCI's page. */
const openNotEligible = async (
  page: Page,
  crn: string,
  mpopReason: string,
): Promise<ManageCheckinsPages> => {
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetupExpectingNotEligible(crn, mpopReason);
  const moci = new ManageCheckinsPages(page);
  await assertRelativeHref(
    moci.notEligible.backLink(),
    "Back on the not eligible page",
    MPOP_PATH.overview(crn),
  );
  return moci;
};

test.describe("Not eligible on data, before any question", () => {
  // New person with no OASys assessment, so no tier
  test("Tier Missing is ruled out before the eligibility questions", async ({
    page,
  }) => {
    const { crn } =
      await test.step("Create a person in NDelius with no OASys assessment", () =>
        new DeliusOffenderJourney(page).createTestOffender());
    await assertTierHeader(crn, null);
    await expect
      .poll(
        async () =>
          (await checkEligibility(crn, null, await getToken())).ruleCode,
        {
          message: `New person ${crn} should be ruled out by the missing tier rule`,
          timeout: 60000,
        },
      )
      .toBe("IS_TIER_MISSING");
    const moci = await openNotEligible(page, crn, NO_TIER_REASON);

    await assertTier(page, crn, /Tier:\s*Missing\b/i);
    await expect(moci.notEligible.missingTierReason()).toBeVisible();
  });

  test("Tier Not_supervised is ruled out before the eligibility questions", async ({
    page,
  }) => {
    const crn = env.tierNotSupervisedCrn();
    await assertTierHeader(crn, "NOT_SUPERVISED");
    await assertEligibility(crn, null, {
      outcome: "INELIGIBLE",
      ruleCode: "HAS_ACTIVE_EVENT",
    });
    await openNotEligible(page, crn, NO_ACTIVE_SENTENCE_REASON);

    await assertTier(page, crn, /Tier:\s*Not[_ ]supervised\b/i);
  });

  test("a case without a supervision package is not eligible", async ({
    page,
  }) => {
    const crn = env.noPackageCrn();

    await assertPackageEligibility(crn, {
      onSupervisionPackage: false,
      inFinalThird: false,
    });
    await assertEligibility(crn, null, {
      outcome: "INELIGIBLE",
      ruleCode: "ON_SUPERVISION_PACKAGE",
    });
    const moci = await openNotEligible(page, crn, NO_PACKAGE_REASON);

    await expect(moci.notEligible.reason()).toContainText(NO_PACKAGE_REASON);
  });

  test("a supervised case in its final third is not eligible", async ({
    page,
  }) => {
    const crn = env.finalThirdCrn();

    await assertPackageEligibility(crn, {
      onSupervisionPackage: true,
      inFinalThird: true,
    });
    await assertEligibility(crn, null, {
      outcome: "INELIGIBLE",
      ruleCode: "IN_FINAL_THIRD",
    });
    const moci = await openNotEligible(page, crn, FINAL_THIRD_REASON);

    await expect(moci.notEligible.reason()).toContainText(FINAL_THIRD_REASON);
  });

  const existingCrnCases: {
    name: string;
    crn: () => string;
    ruleCode: string;
    reason: string;
    mociReason?: string | RegExp;
  }[] = [
    {
      name: "no active sentence",
      crn: env.noActiveSentenceCrn,
      ruleCode: "HAS_ACTIVE_EVENT",
      reason: NO_ACTIVE_SENTENCE_REASON,
      mociReason: NO_ACTIVE_SENTENCE_MOCI_REASON,
    },
    {
      name: "in reset (contact suspended)",
      crn: env.inResetCrn,
      ruleCode: "IS_CONTACT_SUSPENDED",
      reason: IN_RESET_REASON,
    },
    {
      name: "recalled to prison",
      crn: env.recalledCrn,
      ruleCode: "IS_RECALLED",
      reason: RECALLED_REASON,
    },
    {
      name: "provisional tier",
      crn: env.provisionalTierCrn,
      ruleCode: "IS_TIER_PROVISIONAL",
      reason: PROVISIONAL_TIER_REASON,
      mociReason: PROVISIONAL_TIER_MOCI_REASON,
    },
    {
      name: "no practitioner (unallocated)",
      crn: env.unallocatedCrn,
      ruleCode: "IS_PRACTITIONER_ASSIGNED",
      reason: UNALLOCATED_REASON,
    },
  ];

  for (const {
    name,
    crn: crnFor,
    ruleCode,
    reason,
    mociReason,
  } of existingCrnCases) {
    test(`${name} is not eligible`, async ({ page }) => {
      const crn = crnFor();
      await assertEligibility(crn, null, { outcome: "INELIGIBLE", ruleCode });

      const moci = await openNotEligible(page, crn, reason);
      await expect(moci.notEligible.reason()).toContainText(
        mociReason ?? reason,
      );
    });
  }
});
test.describe("Not eligible because of an answer", () => {
  // device restriction rules out every tier, before the programme questions and pilot
  for (const tier of ["A", "C", "G"] as const) {
    test(`Tier ${tier} with a device restriction is not eligible`, async ({
      page,
    }) => {
      const { crn, moci } = await openExistingTierSetup(page, tier);

      await moci.eligibilityCheck.completePage(
        tier === "A"
          ? ["accreditedProgramme", "deviceRestriction"]
          : ["deviceRestriction"],
      );

      await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
      await expect(moci.notEligible.reason()).toContainText(
        DEVICE_RESTRICTION_REASON,
      );
      await expect(
        moci.notEligible.backLink(),
        "Decided by an answer, so Back revisits the check",
      ).toHaveAttribute("href", /\/eligibility-check$/);
    });
  }

  test("Tier G: changing an answer after being found eligible makes them not eligible", async ({
    page,
  }) => {
    const { crn, moci } = await openExistingTierSetup(page, "G");
    await moci.eligibilityCheck.completePage(["none"]);
    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
    const isEligibleUrl = page.url();

    await moci.isEligible.backLink().click();
    await moci.eligibilityCheck.assertOnPage();
    await moci.eligibilityCheck.answerCheckbox("none").uncheck();
    await moci.eligibilityCheck.completePage(["deviceRestriction"]);
    await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);

    await page.goto(isEligibleUrl);
    await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
  });

  test("Tier A: accredited programme with a youth sentence is not eligible without a pilot practitioner", async ({
    page,
  }) => {
    const { crn, moci } = await openExistingTierSetup(
      page,
      "A",
      env.noPilotTierCrn("A"),
    );

    await moci.eligibilityCheck.completePage([
      "accreditedProgramme",
      "youthSentence",
    ]);

    await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
    await expect(moci.notEligible.reason()).toContainText(
      YOUTH_ON_PROGRAMME_REASON,
    );
  });

  test("Tier A: accredited programme with a youth sentence is not eligible even with a pilot practitioner", async ({
    page,
  }) => {
    await requirePilotPractitioner(true);
    const { crn, moci } = await openExistingTierSetup(page, "A");

    await moci.eligibilityCheck.completePage([
      "accreditedProgramme",
      "youthSentence",
    ]);

    await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
    await expect(moci.notEligible.reason()).toContainText(
      YOUTH_ON_PROGRAMME_REASON,
    );
  });

  test("an accredited programme in early engagement is not eligible", async ({
    page,
  }) => {
    const crn = env.earlyEngagementCrn();

    await assertPackageEligibility(crn, {
      onSupervisionPackage: true,
      inFinalThird: false,
      inEarlyEngagement: true,
    });
    await assertEligibility(
      crn,
      {
        accreditedProgramme: true,
        deviceRestriction: false,
        youthSentence: false,
      },
      { outcome: "INELIGIBLE", ruleCode: "IN_EARLY_ENGAGEMENT" },
    );
    const journey = new SetupOnlineCheckinsJourney(page);
    await journey.login();
    await journey.startSetup(crn);

    const moci = new ManageCheckinsPages(page);
    await assertTier(page, crn, /Tier:\s*[AB]\b/);
    await expect(
      page.locator(
        'input[name$="[checkins][eligibility]"][value="earlyEngagement"]',
      ),
    ).toHaveCount(0);
    await moci.eligibilityCheck.completePage(["accreditedProgramme"]);
    await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
    await expect(moci.notEligible.reason()).toContainText(/early engagement/i);

    await expect(
      moci.notEligible.backLink(),
      "Decided after the questions, so Back revisits them",
    ).toHaveAttribute("href", /\/eligibility-check$/);
  });
});

test.describe("Not eligible without a pilot practitioner (Tier A to C off an accredited programme)", () => {
  for (const tier of ["A", "C"] as const) {
    test(`Tier ${tier} is not eligible when the practitioner has never had a pilot case`, async ({
      page,
    }) => {
      const { crn, moci } = await openExistingTierSetup(
        page,
        tier,
        env.noPilotTierCrn(tier),
      );

      await moci.eligibilityCheck.completePage(["none"]);

      await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
      await expect(moci.notEligible.apiReason()).toContainText(
        tier === "C" ? TIER_C_REASON : NOT_ON_PROGRAMME_REASON,
      );
      await expect(moci.notEligible.additionalTierInformation()).toBeVisible();
      await expect(
        moci.notEligible.backLink(),
        "Decided after the questions, so Back revisits them",
      ).toHaveAttribute("href", /\/eligibility-check$/);
    });
  }

  test("Tier A: youth sentence alone is not eligible without a pilot practitioner", async ({
    page,
  }) => {
    const { crn, moci } = await openExistingTierSetup(
      page,
      "A",
      env.noPilotTierCrn("A"),
    );

    await moci.eligibilityCheck.completePage(["youthSentence"]);

    await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
    await expect(moci.notEligible.apiReason()).toContainText(
      NOT_ON_PROGRAMME_REASON,
    );
  });
});
