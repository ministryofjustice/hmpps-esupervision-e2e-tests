import test, { expect } from "@playwright/test";
import { env } from "../../config/env";
import {
  ACCREDITED_PROGRAMME_APPROVAL_TITLE,
  ACCREDITED_PROGRAMME_IS_ELIGIBLE_TITLE,
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
import CaseBanner from "../../support/pages/manage-online-checkins-ui/caseBanner";
import { ManageCheckinsPages } from "../../support/pages/manage-online-checkins-ui/manageCheckinsPages";

// One test per route through MOCI's tier-based eligibility pages. The full
// combination table is unit tested in MOCI (eligibilityDecisionTable.test.ts)
// and, for the ESUP API's rules, in the API (OffenderEligibilityRulesIT), so
// this only proves each route works end to end against real tiers.
//
// Uses a pre-existing CRN for each Tier A-G.
// No test completes setup, so the CRNs can be reused across runs.
//
// With MOCI's useEligibilityEndpoint flag on (ELIGIBILITY_ENDPOINT, on unless
// "off") the ESUP API decides: there is no Recalled box and no pilot question,
// and the API's reason is shown. Tier C, and Tier A/B off an accredited
// programme, are eligible only if the practitioner has ever had a pilot case.
// Those tests mark TEST_PILOT_CASE_CRN as a pilot case, or not, through the
// API's test support, and skip when that can't give what they need. Tests
// marked OLD_JOURNEY go when the flag does.

const OLD_JOURNEY =
  "The pilot question and Recalled box are only asked while useEligibilityEndpoint is off";
const skipOldJourney = () => test.skip(env.eligibilityEndpoint(), OLD_JOURNEY);
const skipNewJourney = () =>
  test.skip(
    !env.eligibilityEndpoint(),
    "Only while useEligibilityEndpoint is on",
  );

test.afterEach(resetPilotCase);

const NOT_ON_PROGRAMME_REASON =
  "is not eligible for online check ins because they are in Tier A or B, and are not on accredited programme";
const DEVICE_RESTRICTION_REASON =
  "because they have sentence conditions that mean they can't use a device or internet";
const TIER_C_REASON =
  "is not eligible for online check ins because they are in Tier C";

for (const tier of ["D", "E", "F"] as const) {
  test(`Tier ${tier} follows its eligibility route`, async ({ page }) => {
    const { crn, moci } = await openExistingTierSetup(page, tier);
    await assertRelativeHref(
      moci.eligibilityCheck.cancelLink(),
      "Cancel and go back",
      MPOP_PATH.overview(crn),
    );
    await expect(
      moci.eligibilityCheck.answerCheckbox("accreditedProgramme"),
    ).toHaveCount(0);
    await moci.eligibilityCheck.completePage(["none"]);

    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
  });
}

// Tiers A to C off an accredited programme are decided by the pilot.
test.describe("Tier A to C without an accredited programme", () => {
  for (const tier of ["A", "B", "C"] as const) {
    test(`Tier ${tier} is eligible when the practitioner has had a pilot case`, async ({
      page,
    }) => {
      skipNewJourney();
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

    test(`Tier ${tier} is not eligible when the practitioner has never had a pilot case`, async ({
      page,
    }) => {
      skipNewJourney();
      await requirePilotPractitioner(false);
      const { crn, moci } = await openExistingTierSetup(page, tier);

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

  // S9 beyond Tier G: the device restriction answer rules out every tier, ahead of the Tier A/B
  // programme questions and the pilot.
  for (const tier of ["A", "C"] as const) {
    test(`Tier ${tier} with a device restriction is not eligible, whatever the pilot`, async ({
      page,
    }) => {
      skipNewJourney();
      const { crn, moci } = await openExistingTierSetup(page, tier);

      await moci.eligibilityCheck.completePage(
        tier === "A"
          ? ["accreditedProgramme", "deviceRestriction"]
          : ["deviceRestriction"],
      );

      await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
      await expect(moci.notEligible.apiReason()).toContainText(
        DEVICE_RESTRICTION_REASON,
      );
      await expect(
        moci.notEligible.backLink(),
        "Decided by an answer, so Back revisits the check",
      ).toHaveAttribute("href", /\/eligibility-check$/);
    });
  }
});

for (const tier of ["B", "C"] as const) {
  test(`Tier ${tier} follows its pilot question route`, async ({ page }) => {
    skipOldJourney();
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

    await assertManageCheckinsPage(page, crn, PILOT_CHECK_TITLE);
    await moci.pilotCheck.answer(true);

    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
  });
}

// Tier G stands in for the D-G band: eligible without the pilot question.
test.describe("Tier G", () => {
  test.skip("case banner matches MPOP on entering MOCI", async ({ page }) => {
    // Skipped : MPOP uses new person header
    // MOCI still uses old pop header reenable when MOCI flag is on
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
    // TEST_TIER_G_CRN has 2 sentences, so sentence selection comes before frequency.
    await moci.sentenceSelection.assertOnPage();
    await moci.sentenceSelection.completePage();
    await moci.checkinFrequency.assertOnPage();
  });

  test("is not asked whether they have been recalled", async ({ page }) => {
    skipNewJourney();
    const { moci } = await openExistingTierSetup(page, "G");

    await expect(
      moci.eligibilityCheck.answerCheckbox("recalled"),
      "Recall comes from NDelius when the ESUP API decides",
    ).toHaveCount(0);
  });

  test("a disqualifying answer makes them not eligible", async ({ page }) => {
    skipOldJourney();
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
      env.eligibilityEndpoint()
        ? DEVICE_RESTRICTION_REASON
        : "has restrictions that mean they cannot use a device or the internet",
    );
    await expect(
      moci.notEligible.backLink(),
      "Decided by an answer, so Back revisits the check",
    ).toHaveAttribute("href", /\/eligibility-check$/);
  });

  test("changing an answer after being found eligible makes them not eligible", async ({
    page,
  }) => {
    skipNewJourney();
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
    skipOldJourney();
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
    skipOldJourney();
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
    if (env.eligibilityEndpoint()) {
      // A pilot person goes the standard way instead, without approval or rationale
      await assertEligibility(
        crn,
        {
          accreditedProgramme: true,
          deviceRestriction: false,
          youthSentence: false,
        },
        { outcome: "ELIGIBLE", ruleCode: "IN_EARLY_ENGAGEMENT" },
      );
    }

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
    const mpop = new ManageCheckinsPages(page);
    await mpop.rationale.assertOnPage();
    await mpop.rationale.completePage("E2E accredited programme rationale");
    // Stops here: completing setup would use up the existing CRN.
    await mpop.checkinFrequency.assertOnPage();
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
      /on an accredited programme, but (they )?are on a youth sentence/,
    );
  });

  // S19 and S18: a youth sentence alone is decided as if nothing were ticked - by the pilot
  test("youth sentence alone is eligible with a pilot practitioner", async ({
    page,
  }) => {
    skipNewJourney();
    await requirePilotPractitioner(true);
    const { crn, moci } = await openExistingTierSetup(page, "A");

    await moci.eligibilityCheck.completePage(["youthSentence"]);

    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
  });

  test("youth sentence alone is not eligible without a pilot practitioner", async ({
    page,
  }) => {
    skipNewJourney();
    await requirePilotPractitioner(false);
    const { crn, moci } = await openExistingTierSetup(page, "A");

    await moci.eligibilityCheck.completePage(["youthSentence"]);

    await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
    await expect(moci.notEligible.apiReason()).toContainText(
      NOT_ON_PROGRAMME_REASON,
    );
  });

  // S16: on an accredited programme the pilot doesn't apply, so a youth sentence still rules them out
  test("accredited programme with a youth sentence is not eligible even with a pilot practitioner", async ({
    page,
  }) => {
    skipNewJourney();
    await requirePilotPractitioner(true);
    const { crn, moci } = await openExistingTierSetup(page, "A");

    await moci.eligibilityCheck.completePage([
      "accreditedProgramme",
      "youthSentence",
    ]);

    await assertManageCheckinsPage(page, crn, NOT_ELIGIBLE_TITLE);
    await expect(moci.notEligible.reason()).toContainText(
      /on an accredited programme, but are on a youth sentence/,
    );
  });

  // U2: the pilot question has gone, so its page sends you on to wherever the check leads
  test("the pilot question page can't be reached", async ({ page }) => {
    skipNewJourney();
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

  test("youth sentence alone is eligible when the pilot answer is Yes", async ({
    page,
  }) => {
    skipOldJourney();
    const { crn, moci } = await openExistingTierSetup(page, "A");

    await moci.eligibilityCheck.completePage(["youthSentence"]);
    await assertManageCheckinsPage(page, crn, PILOT_CHECK_TITLE);

    await moci.pilotCheck.answer(true);

    await assertManageCheckinsPage(page, crn, IS_ELIGIBLE_TITLE);
  });
});

// A new person in NDelius is on a supervision package but has no tier until an OASys assessment,
// which this deliberately skips - so they reach the missing tier rule rather than being ruled
// out sooner, as a long-lived CRN can drift into.
test("Tier Missing is ruled out before the eligibility questions", async ({
  page,
}) => {
  const { crn } =
    await test.step("Create a person in NDelius with no OASys assessment", () =>
      new DeliusOffenderJourney(page).createTestOffender());
  await assertTierHeader(crn, null);
  if (env.eligibilityEndpoint()) {
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
  }
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetupExpectingNotEligible(crn);

  await assertTier(page, crn, /Tier:\s*Missing\b/i);
  const moci = new ManageCheckinsPages(page);
  await expect(moci.notEligible.missingTierReason()).toBeVisible();
  await assertRelativeHref(
    moci.notEligible.backLink(),
    "Back on the not eligible page",
    MPOP_PATH.overview(crn),
  );
});

test("Tier Not_supervised is ruled out before the eligibility questions", async ({
  page,
}) => {
  const crn = env.tierNotSupervisedCrn();
  await assertTierHeader(crn, "NOT_SUPERVISED");
  if (env.eligibilityEndpoint()) {
    // The API rules out in its own order, so a CRN ruled out sooner would show another reason
    await assertEligibility(crn, null, {
      outcome: "INELIGIBLE",
      ruleCode: "HAS_ACTIVE_EVENT",
    });
  }
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetupExpectingNotEligible(crn);

  await assertTier(page, crn, /Tier:\s*Not[_ ]supervised\b/i);
  const moci = new ManageCheckinsPages(page);
  await assertRelativeHref(
    moci.notEligible.backLink(),
    "Back on the not eligible page",
    MPOP_PATH.overview(crn),
  );
});

test("a case without a supervision package is not eligible", async ({
  page,
}) => {
  const crn = env.noPackageCrn();

  await assertPackageEligibility(crn, {
    onSupervisionPackage: false,
    inFinalThird: false,
  });
  if (env.eligibilityEndpoint()) {
    await assertEligibility(crn, null, {
      outcome: "INELIGIBLE",
      ruleCode: "ON_SUPERVISION_PACKAGE",
    });
  }
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetupExpectingNotEligible(crn);

  const moci = new ManageCheckinsPages(page);
  await expect(moci.notEligible.reason()).toContainText(
    /(is|are) not on a supervision package/,
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
  if (env.eligibilityEndpoint()) {
    await assertEligibility(crn, null, {
      outcome: "INELIGIBLE",
      ruleCode: "IN_FINAL_THIRD",
    });
  }
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
  if (env.eligibilityEndpoint()) {
    await assertEligibility(
      crn,
      {
        accreditedProgramme: true,
        deviceRestriction: false,
        youthSentence: false,
      },
      { outcome: "INELIGIBLE", ruleCode: "IN_EARLY_ENGAGEMENT" },
    );
  }
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

// S20: early engagement only counts on an accredited programme, so off one the pilot decides
test("in early engagement but not on a programme, eligible with a pilot practitioner", async ({
  page,
}) => {
  skipNewJourney();
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
