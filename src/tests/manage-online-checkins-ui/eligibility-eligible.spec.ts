import test, { expect, type Page } from "@playwright/test";
import { env } from "../../config/env";
import {
  ACCREDITED_PROGRAMME_APPROVAL_TITLE,
  ACCREDITED_PROGRAMME_IS_ELIGIBLE_TITLE,
  DISCUSS_BEFORE_SIGNUP_TITLE,
  IS_ELIGIBLE_TITLE,
  ELIGIBILITY_CHECK_TITLE,
  errorTitle,
} from "../../data/manage-online-checkins-ui/pageTitles";
import { assertManageCheckinsPage } from "../../support/assertions/manage-online-checkins-ui/manageCheckinsAssertions";
import {
  assertRelativeHref,
  MPOP_PATH,
} from "../../support/assertions/manage-online-checkins-ui/mpopHandoff";
import {
  assertEligibility,
  requirePilotPractitioner,
  resetPilotCase,
} from "../../support/assertions/api/eligibilityAPI";
import { ACCREDITED_PROGRAMME_RULE } from "../../api/eligibility";
import { openExistingTierSetup } from "../../support/fixtures/existingTierCase";
import SetupOnlineCheckinsJourney from "../../support/journeys/manage-online-checkins-ui/setupOnlineCheckinsJourney";
import { ManageCheckinsPages } from "../../support/pages/manage-online-checkins-ui/manageCheckinsPages";
import { ExistingTier } from "../../data/models";
import { MAY_BE_ELIGIBLE_CARD_TEXT } from "../../data/manage-online-checkins-ui/eligibilityReasons";

// Eligible routes, using existing Tier A-G CRNs (setup is never completed).

test.afterEach(resetPilotCase);

/** Opens setup for a Tier D-G case: Cancel goes back to MPOP. */
const openEligibilityCheck = async (page: Page, tier: ExistingTier) => {
  const setup = await openExistingTierSetup(page, tier);
  await assertRelativeHref(
    setup.moci.eligibilityCheck.cancelLink(),
    "Cancel and go back",
    MPOP_PATH.overview(setup.crn),
  );
  return setup;
};

test("MPOP card before setup: Tier A to G may be eligible, with the setup link", async ({
  page,
}) => {
  await new SetupOnlineCheckinsJourney(page).login();
  const { overview } = new ManageCheckinsPages(page);
  for (const tier of ["A", "B", "C", "D", "E", "F", "G"] as const) {
    await test.step(`Tier ${tier}`, async () => {
      await overview.goTo(env.tierCrn(tier));
      await overview.assertOnPage();
      await expect(overview.nextCheckinValue()).toContainText(
        MAY_BE_ELIGIBLE_CARD_TEXT,
      );
      await expect(overview.setupLink()).toBeVisible();
    });
  }
});

test.describe("Eligible without the pilot (Tier D to G)", () => {
  for (const tier of ["D", "E", "F"] as const) {
    test(`Tier ${tier} follows its eligibility route`, async ({ page }) => {
      const { crn, moci } = await openEligibilityCheck(page, tier);
      await moci.eligibilityCheck.completePage(["none"]);

      await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
    });
  }

  test("Tier G: eligible without the pilot question, then on to the check in date", async ({
    page,
  }) => {
    const { crn, moci } = await openEligibilityCheck(page, "G");

    await moci.eligibilityCheck.completePage(["none"]);

    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
    await assertRelativeHref(
      moci.isEligible.cancelLink(),
      "Cancel on the eligible page",
      MPOP_PATH.overview(crn),
    );
    await expect(moci.isEligible.reasonBullets()).toHaveText([
      "have not been recalled to prison",
      "have no sentence restrictions that mean they cannot use a device or the internet",
      "are not in the final third of their sentence",
    ]);
    await expect(moci.isEligible.discussionPoints()).toHaveCount(4);
    await moci.isEligible.completePage();
    // TEST_TIER_G_CRN has 2 sentences, so sentence selection comes before frequency.
    await moci.sentenceSelection.assertOnPage();
    await moci.sentenceSelection.completePage();
    await moci.checkinFrequency.assertOnPage();
  });
});

test.describe("Eligible through the pilot (Tier A to C off an accredited programme)", () => {
  for (const tier of ["A", "B", "C"] as const) {
    test(`Tier ${tier} is eligible when the practitioner has had a pilot case`, async ({
      page,
    }) => {
      await requirePilotPractitioner(true);
      const { crn, moci } = await openExistingTierSetup(page, tier);

      await moci.eligibilityCheck.completePage(["none"]);

      await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
      await expect(moci.isEligible.reason()).toContainText(
        "before 1 October 2026",
      );
      await expect(
        moci.isEligible.backLink(),
        "No pilot question to go back to",
      ).toHaveAttribute("href", /\/eligibility-check$/);
    });
  }

  test("Tier A: youth sentence alone is eligible with a pilot practitioner", async ({
    page,
  }) => {
    await requirePilotPractitioner(true);
    const { crn, moci } = await openExistingTierSetup(page, "A");

    await moci.eligibilityCheck.completePage(["youthSentence"]);

    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
  });

  test("in early engagement but not on a programme, eligible with a pilot practitioner", async ({
    page,
  }) => {
    await requirePilotPractitioner(true);
    const crn = env.earlyEngagementCrn();
    await assertEligibility(
      crn,
      {
        accreditedProgramme: false,
        deviceRestriction: false,
        youthSentence: false,
      },
      { outcome: "ELIGIBLE", ruleCode: "PRACTITIONER_HAS_PILOT_CASE_TIER_A_B" },
    );
    const journey = new SetupOnlineCheckinsJourney(page);
    await journey.login();
    await journey.startSetup(crn);
    const moci = new ManageCheckinsPages(page);

    await moci.eligibilityCheck.completePage(["none"]);

    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
  });
});

test.describe("Eligible on an accredited programme (Tier A/B)", () => {
  test("Tier A: accredited programme goes through approval and rationale to the check in date", async ({
    page,
  }) => {
    const { crn, moci } = await openExistingTierSetup(page, "A");
    await assertEligibility(
      crn,
      {
        accreditedProgramme: true,
        deviceRestriction: false,
        youthSentence: false,
      },
      { outcome: "ELIGIBLE", ruleCode: ACCREDITED_PROGRAMME_RULE },
    );

    await moci.eligibilityCheck.completePage(["accreditedProgramme"]);

    await assertManageCheckinsPage(
      page,
      crn,
      ACCREDITED_PROGRAMME_IS_ELIGIBLE_TITLE,
    );
    await expect(moci.isEligible.reason()).toContainText(
      "on an accredited programme",
    );
    await expect(moci.isEligible.discussionPoints()).toHaveCount(5);
    await expect(
      moci.isEligible.discussionCheckbox("programmeOnly"),
      "Programme route asks for a fifth discussion point",
    ).toBeVisible();
    await moci.isEligible.completePage();

    await assertManageCheckinsPage(
      page,
      crn,
      ACCREDITED_PROGRAMME_APPROVAL_TITLE,
    );
    await moci.accreditedProgrammeApproval.completePage();
    await moci.rationale.assertOnPage();
    await moci.rationale.completePage("E2E accredited programme rationale");
    // Stops here: completing setup would use up the existing CRN.
    await moci.checkinFrequency.assertOnPage();
  });
});

test.describe("Eligibility check page", () => {
  test("Tier G: no Recalled box, and submitting nothing shows the error", async ({
    page,
  }) => {
    const { crn, moci } = await openExistingTierSetup(page, "G");
    const recalled = moci.eligibilityCheck.answerCheckbox("recalled");
    await expect(recalled, "Recall comes from NDelius").toHaveCount(0);

    await moci.eligibilityCheck.completePage([]);

    await assertManageCheckinsPage(
      page,
      crn,
      errorTitle(ELIGIBILITY_CHECK_TITLE),
    );
    await expect(moci.eligibilityCheck.errorSummary()).toContainText(
      "Select if any of these apply to the person",
    );
    await expect(recalled, "Recall comes from NDelius").toHaveCount(0);
  });

  test("Tier G: an incomplete discussion leads to discuss before sign up", async ({
    page,
  }) => {
    const { crn, moci } = await openExistingTierSetup(page, "G");
    await moci.eligibilityCheck.completePage(["none"]);
    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);

    await moci.isEligible.completePartially(["optional", "canStop"]);

    await assertManageCheckinsPage(page, crn, DISCUSS_BEFORE_SIGNUP_TITLE);
  });

  test("Tier A: the pilot question page can't be reached", async ({ page }) => {
    const { crn, moci } = await openExistingTierSetup(page, "A");
    const setupUrl = new URL(page.url());
    setupUrl.pathname = setupUrl.pathname.replace(
      /\/eligibility-check$/,
      "/pilot-check",
    );
    setupUrl.search = "";
    const pilotCheckUrl = setupUrl.toString();
    expect(
      pilotCheckUrl,
      "Setup should open on the eligibility check",
    ).not.toBe(page.url());

    await test.step("Before answering, back to the eligibility check", async () => {
      await page.goto(pilotCheckUrl);
      await moci.eligibilityCheck.assertOnPage();
    });

    await test.step("Once eligible, on to the eligible page", async () => {
      await moci.eligibilityCheck.completePage(["accreditedProgramme"]);
      await assertManageCheckinsPage(
        page,
        crn,
        ACCREDITED_PROGRAMME_IS_ELIGIBLE_TITLE,
      );
      await page.goto(pilotCheckUrl);
      await assertManageCheckinsPage(
        page,
        crn,
        ACCREDITED_PROGRAMME_IS_ELIGIBLE_TITLE,
      );
    });
  });
});
