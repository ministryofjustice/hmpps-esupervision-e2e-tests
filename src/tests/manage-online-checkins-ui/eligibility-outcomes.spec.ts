import test, { expect } from "@playwright/test";
import { env } from "../../config/env";
import {
  ACCREDITED_PROGRAMME_APPROVAL_TITLE,
  DISCUSS_BEFORE_SIGNUP_TITLE,
  IS_ELIGIBLE_TITLE,
  NOT_ELIGIBLE_TITLE,
  PILOT_CHECK_TITLE,
} from "../../data/manage-online-checkins-ui/pageTitles";
import { assertManageCheckinsPage } from "../../support/assertions/manage-online-checkins-ui/manageCheckinsAssertions";
import {
  assertPackageEligibility,
  assertTierHeader,
  assertTierCrnPreconditions,
} from "../../support/assertions/api/supervisionPackageAPI";
import { assertTier } from "../../support/assertions/manage-online-checkins-ui/manageCheckinsAssertions";
import {
  assertRelativeHref,
  MPOP_PATH,
} from "../../support/assertions/manage-online-checkins-ui/mpopHandoff";
import { urlPathPattern } from "../../support/utils/url";
import { openExistingTierSetup } from "../../support/fixtures/existingTierCase";
import SetupOnlineCheckinsJourney from "../../support/journeys/manage-online-checkins-ui/setupOnlineCheckinsJourney";
import CaseBanner from "../../support/pages/manage-online-checkins-ui/caseBanner";
import { ManageCheckinsPages } from "../../support/pages/manage-online-checkins-ui/manageCheckinsPages";

// One test per route through MOCI's tier-based eligibility pages. The full
// combination table is unit tested in MOCI (eligibilityDecisionTable.test.ts),
// so this only proves each route works end to end against real tiers.
//
// Uses a pre-existing CRN for each Tier A-G.
// No test completes setup, so the CRNs can be reused across runs.

for (const tier of ["B", "C", "D", "E", "F"] as const) {
  test(`Tier ${tier} follows its eligibility route`, async ({ page }) => {
    const { crn, moci } = await openExistingTierSetup(page, tier);
    await assertRelativeHref(
      moci.eligibilityCheck.cancelLink(),
      "Cancel and go back",
      MPOP_PATH.overview(crn),
    );
    if (tier === "B") {
      await expect(
        moci.eligibilityCheck.answerCheckbox("accreditedProgramme"),
      ).toBeVisible();
    } else {
      await expect(
        moci.eligibilityCheck.answerCheckbox("accreditedProgramme"),
      ).toHaveCount(0);
    }
    await moci.eligibilityCheck.completePage(["none"]);

    if (tier === "B" || tier === "C") {
      await assertManageCheckinsPage(page, crn, PILOT_CHECK_TITLE);
      await moci.pilotCheck.answer(true);
    }

    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
  });
}

// Tier G stands in for the D-G band: eligible without the pilot question.
test.describe("Tier G", () => {
  test("case banner matches MPOP on entering MOCI", async ({ page }) => {
    const crn = env.tierCrn("G");
    await assertTierCrnPreconditions(crn, "G");
    const mpop = new ManageCheckinsPages(page);
    const journey = new SetupOnlineCheckinsJourney(page);
    await journey.login();
    await mpop.overview.goTo(crn);
    await mpop.overview.assertOnPage();
    const mpopHeader = await mpop.overview.caseHeaderDetails().innerText();
    const mpopFields = await mpop.overview.caseHeaderFields().allInnerTexts();

    await journey.startSetup(crn);
    const moci = new CaseBanner(page);
    await expect(moci.details()).toHaveText(mpopHeader);
    await expect(moci.fields()).toHaveText(mpopFields);
  });

  test("eligible without the pilot question, then on to the check in date", async ({
    page,
  }) => {
    const { crn, moci } = await openExistingTierSetup(page, "G");
    await assertRelativeHref(
      moci.eligibilityCheck.cancelLink(),
      "Cancel and go back",
      MPOP_PATH.overview(crn),
    );
    await expect(
      moci.eligibilityCheck.answerCheckbox("accreditedProgramme"),
      "Accredited programme is a Tier A/B question only",
    ).toHaveCount(0);

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
    await new ManageCheckinsPages(page).dateFrequency.assertOnPage();
  });

  test("a disqualifying answer makes them not eligible", async ({ page }) => {
    const { crn, moci } = await openExistingTierSetup(page, "G");

    await moci.eligibilityCheck.completePage(["recalled"]);

    await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
    await expect(moci.notEligible.reason()).toContainText(
      "has been recalled to prison",
    );
  });

  test("device restriction disqualifies", async ({ page }) => {
    const { crn, moci } = await openExistingTierSetup(page, "G");

    await moci.eligibilityCheck.completePage(["deviceRestriction"]);

    await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
    await expect(moci.notEligible.reason()).toContainText(
      "has restrictions that mean they cannot use a device or the internet",
    );
  });

  test("an incomplete discussion leads to discuss before sign up", async ({
    page,
  }) => {
    const { crn, moci } = await openExistingTierSetup(page, "G");
    await moci.eligibilityCheck.completePage(["none"]);
    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);

    await moci.isEligible.completePartially(["optional", "canStop"]);

    await assertManageCheckinsPage(page, crn, DISCUSS_BEFORE_SIGNUP_TITLE);
  });
});
// Tier A stands in for the A/B band, and for the pilot route Tier C shares.
test.describe("Tier A", () => {
  test("pilot Yes makes them eligible", async ({ page }) => {
    const { crn, moci } = await openExistingTierSetup(page, "A");
    await assertRelativeHref(
      moci.eligibilityCheck.cancelLink(),
      "Cancel and go back",
      MPOP_PATH.overview(crn),
    );
    await moci.eligibilityCheck.completePage(["none"]);
    await assertManageCheckinsPage(page, crn, PILOT_CHECK_TITLE);

    await moci.pilotCheck.answer(true);

    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
    await expect(moci.isEligible.reason()).toContainText(
      "before 1 October 2026",
    );
  });

  test("pilot No makes them not eligible", async ({ page }) => {
    const { crn, moci } = await openExistingTierSetup(page, "A");
    await moci.eligibilityCheck.completePage(["none"]);
    await assertManageCheckinsPage(page, crn, PILOT_CHECK_TITLE);

    await moci.pilotCheck.answer(false);

    await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
    await expect(moci.notEligible.reason()).toContainText("is in Tier A and");
    await expect(moci.notEligible.reasonBullets()).toHaveText([
      "not on an accredited programme",
      "you have no people who were signed up to use online check ins before 1 October 2026",
    ]);
  });

  test("accredited programme goes through approval and rationale to the check in date", async ({
    page,
  }) => {
    const { crn, moci } = await openExistingTierSetup(page, "A");

    await moci.eligibilityCheck.completePage(["accreditedProgramme"]);

    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
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
    const mpop = new ManageCheckinsPages(page);
    await mpop.rationale.assertOnPage();
    await mpop.rationale.completePage("E2E accredited programme rationale");
    // Stops here: completing setup would use up the existing CRN.
    await mpop.dateFrequency.assertOnPage();
  });

  test("accredited programme with a youth sentence is not eligible", async ({
    page,
  }) => {
    const { crn, moci } = await openExistingTierSetup(page, "A");

    await moci.eligibilityCheck.completePage([
      "accreditedProgramme",
      "youthSentence",
    ]);

    await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
    await expect(moci.notEligible.reason()).toContainText(
      "on an accredited programme, but they are on a youth sentence",
    );
  });

  test("youth sentence alone is eligible when the pilot answer is Yes", async ({
    page,
  }) => {
    const { crn, moci } = await openExistingTierSetup(page, "A");

    await moci.eligibilityCheck.completePage(["youthSentence"]);
    await assertManageCheckinsPage(page, crn, PILOT_CHECK_TITLE);

    await moci.pilotCheck.answer(true);

    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
  });
});

for (const { status, crn, tierText, headerTier } of [
  {
    status: "Missing",
    crn: env.tierMissingCrn(),
    tierText: /Tier:\s*Missing\b/i,
    headerTier: null,
  },
  {
    status: "Not_supervised",
    crn: env.tierNotSupervisedCrn(),
    tierText: /Tier:\s*Not[_ ]supervised\b/i,
    headerTier: "NOT_SUPERVISED",
  },
]) {
  test(`Tier ${status} is ruled out before the eligibility questions`, async ({
    page,
  }) => {
    await assertTierHeader(crn, headerTier);
    const journey = new SetupOnlineCheckinsJourney(page);
    await journey.login();
    await journey.startSetupExpectingNotEligible(crn);

    await assertTier(page, crn, tierText);
    const moci = new ManageCheckinsPages(page);
    if (status === "Missing") {
      await expect(moci.notEligible.missingTierReason()).toBeVisible();
    }
    await assertRelativeHref(
      moci.notEligible.backLink(),
      "Back on the not eligible page",
      MPOP_PATH.overview(crn),
    );
  });
}

test("a case without a supervision package is not eligible", async ({
  page,
}) => {
  const crn = env.noPackageCrn();

  await assertPackageEligibility(crn, {
    onSupervisionPackage: false,
    inFinalThird: false,
  });
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetupExpectingNotEligible(crn);

  const moci = new ManageCheckinsPages(page);
  await expect(moci.notEligible.reason()).toContainText(
    "is not on a supervision package",
  );
  await assertRelativeHref(
    moci.notEligible.backLink(),
    "Back on the not eligible page",
    MPOP_PATH.overview(crn),
  );
});

test("a supervised case in its final third is not eligible", async ({
  page,
}) => {
  const crn = env.finalThirdCrn();

  await assertPackageEligibility(crn, {
    onSupervisionPackage: true,
    inFinalThird: true,
  });
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetupExpectingNotEligible(crn);

  const moci = new ManageCheckinsPages(page);
  await expect(moci.notEligible.reason()).toContainText(/final third/i);
  await assertRelativeHref(
    moci.notEligible.backLink(),
    "Back on the not eligible page",
    MPOP_PATH.overview(crn),
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

  const backLink = moci.notEligible.backLink();
  const backHref = await backLink.getAttribute("href");
  expect(backHref).toBeTruthy();
  if (!backHref) throw new Error("Not eligible page Back link has no href");
  await Promise.all([
    page.waitForURL(urlPathPattern(env.manageCheckinsUiUrl(), backHref)),
    backLink.click(),
  ]);
  await moci.eligibilityCheck.assertOnPage();

  const cancelLink = moci.eligibilityCheck.cancelLink();
  await Promise.all([
    page.waitForURL(urlPathPattern(env.mpopUrl(), MPOP_PATH.overview(crn))),
    cancelLink.click(),
  ]);
  await moci.overview.assertOnPage();
});
