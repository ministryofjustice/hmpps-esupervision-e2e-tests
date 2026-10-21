import test, { expect, Page } from "@playwright/test";
import { env } from "../../config/env";
import ManageCheckInsJourney from "../../support/journeys/manage-online-checkins-ui/manageCheckinsJourney";
import SetupOnlineCheckinsJourney from "../../support/journeys/manage-online-checkins-ui/setupOnlineCheckinsJourney";
import { FrequencyOptions } from "../../support/pages/manage-online-checkins-ui/checkInFrequencyPage";
import { firstCheckinDateString } from "../../support/utils/date";
import { ManageCheckinsPages } from "../../support/pages/manage-online-checkins-ui/manageCheckinsPages";
import { openExistingTierSetup } from "../../support/fixtures/existingTierCase";
import {
  assertActiveManageCrn,
  assertTierCrnPreconditions,
} from "../../support/assertions/api/supervisionPackageAPI";
import {
  assertManageCheckinsPage,
  assertTier,
} from "../../support/assertions/manage-online-checkins-ui/manageCheckinsAssertions";
import {
  ELIGIBILITY_CHECK_TITLE,
  errorTitle,
  PILOT_CHECK_TITLE,
} from "../../data/manage-online-checkins-ui/pageTitles";

const manageCrn = env.manageCrn();
const setupValidationCrn = env.tierCrn("G");
const adhocCrn = env.adhocCrn();

test.beforeAll(async () => {
  await assertActiveManageCrn(manageCrn);
});

const openSetupValidationFrequency = async (page: Page) => {
  await assertTierCrnPreconditions(setupValidationCrn, "G");
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(setupValidationCrn);
  await assertTier(page, setupValidationCrn, /Tier:\s*[A-G]\d*\b/);
  return journey.completeSetupToFrequency(setupValidationCrn);
};

test.describe("Validation errors", () => {
  test.describe("Change contact details", () => {
    // Kept deliberately minimal - the manage-page contact details flow is
    // expected to change again soon, so this covers only the core rule
    // (required field tracks the offender's saved preference) rather than
    // every format/persistence permutation.
    test("only the field matching the offender's saved preference is required", async ({
      page,
    }) => {
      const manage = new ManageCheckInsJourney(page);
      await manage.login();
      const manageCheckinsPages = new ManageCheckinsPages(page);

      const managePage = await manage.openManage(manageCrn);
      await managePage.clickChangeContactDetails();
      // Shared offender's preference is email - clearing the other detail
      // (mobile) should produce no error on its own.
      await manageCheckinsPages.contactDetails
        .changeEmailAddressButton()
        .click();
      const editContactDetails = manageCheckinsPages.editContactDetails;
      await editContactDetails.mobileNumberField().fill("");
      await editContactDetails.emailAddressField().fill("");
      await editContactDetails.save();

      await expect(editContactDetails.errorSummary()).toContainText(
        "Enter an email address",
      );
      await expect(editContactDetails.errorSummary()).not.toContainText(
        "mobile number",
      );
      await expect(
        editContactDetails.fieldError("Enter an email address"),
      ).toBeVisible();
    });
  });

  test("shows a validation error when adding a custom question with no question text", async ({
    page,
  }) => {
    const manage = new ManageCheckInsJourney(page);
    await manage.login();
    const mpopPages = new ManageCheckinsPages(page);

    const manageQ = await manage.openManage(manageCrn);
    // Questions are only editable if the next check in is in the future.
    await expect(
      manageQ.changeQuestionsLink(),
      "Shared offender needs a future check in for questions to be editable",
    ).toBeVisible();
    await manageQ.clickChangeQuestions();
    await mpopPages.howToWriteQuestions.clickAddQuestions();
    await expect(
      mpopPages.addQuestions.addQuestionButton(),
      "TEST_MANAGE_CRN must have room for a validation question",
    ).toBeVisible();
    await mpopPages.addQuestions.clickAddQuestion();
    await mpopPages.chooseQuestion.selectQuestionByTemplate("Do you");
    await mpopPages.editQuestion.questionInput().fill("");
    await mpopPages.editQuestion.clickContinue();

    await expect(mpopPages.editQuestion.errorSummary()).toContainText(
      "Enter what you want to ask",
    );
    await expect(
      mpopPages.editQuestion.fieldError("Enter what you want to ask"),
    ).toBeVisible();
  });

  test("shows validation errors when stopping check ins with no reason", async ({
    page,
  }) => {
    const manage = new ManageCheckInsJourney(page);
    await manage.login();
    const mpopPages = new ManageCheckinsPages(page);

    const manageStop = await manage.openManage(manageCrn);
    await manageStop.clickStopCheckIns();
    await mpopPages.stop.clickContinue();

    await expect(mpopPages.stop.errorSummary()).toContainText(
      "Enter the reason for stopping",
    );
    await expect(mpopPages.stop.errorSummary()).toContainText(
      "Select yes if the reason for stopping includes sensitive information",
    );
    await expect(
      mpopPages.stop.fieldError("Enter the reason for stopping"),
    ).toBeVisible();
    await expect(
      mpopPages.stop.fieldError(
        "Select yes if the reason for stopping includes sensitive information",
      ),
    ).toBeVisible();
  });

  test.describe("Setup wizard - date and frequency", () => {
    // Reuses a tiered case that has no active online check-in setup.
    test("rejects a first check in date that is in the past or malformed", async ({
      page,
    }) => {
      const frequency = await openSetupValidationFrequency(page);
      await frequency.completePage(FrequencyOptions.EVERY_WEEK);
      const date = new ManageCheckinsPages(page).checkinDate;
      await date.assertOnPage();
      const pastDate =
        "The first online check in date must be today or in the future";
      await date.completePage(firstCheckinDateString(-7));
      await expect(date.errorSummary()).toContainText(pastDate);
      await expect(date.fieldError(pastDate)).toBeVisible();
      await date.assertOnPage();

      // 31 February looks well-formed but isn't a real date - same error either way.
      const badFormat =
        "Enter a date in the correct format, for example 17/5/2024";
      await date.completePage("31/2/2026");
      await expect(date.errorSummary()).toContainText(badFormat);
      await expect(date.fieldError(badFormat)).toBeVisible();
      await date.assertOnPage();
    });

    test("shows validation errors when the check in date and frequency are left blank", async ({
      page,
    }) => {
      const frequency = await openSetupValidationFrequency(page);
      const noFrequency =
        "Select how often you would like the person to check in";
      await frequency.completePage();
      await expect(frequency.errorSummary()).toContainText(noFrequency);
      await expect(frequency.fieldError(noFrequency)).toBeVisible();
      await frequency.assertOnPage();
      await frequency.completePage(FrequencyOptions.EVERY_WEEK);
      // Neither field has been filled yet on this fresh page.
      const noDate =
        "Enter the date you would like the person to complete their first check in";
      const date = new ManageCheckinsPages(page).checkinDate;
      await date.assertOnPage();
      await date.completePage("");
      await expect(date.errorSummary()).toContainText(noDate);
      await expect(date.fieldError(noDate)).toBeVisible();
      await date.assertOnPage();
    });
  });

  test.describe("Setup wizard - eligibility", () => {
    // The validation checks reuse existing CRNs.
    // The no-tier case is covered by TEST_TIER_MISSING_CRN test (lines ~250+).

    test("shows a validation error when no eligibility answer is selected", async ({
      page,
    }) => {
      const { crn, moci } = await openExistingTierSetup(page, "G");
      const message = "Select if any of these apply to the person";

      await moci.eligibilityCheck.completePage([]);

      await expect(moci.eligibilityCheck.errorSummary()).toContainText(message);
      await expect(moci.eligibilityCheck.fieldError(message)).toBeVisible();
      await assertManageCheckinsPage(
        page,
        crn,
        errorTitle(ELIGIBILITY_CHECK_TITLE),
      );
    });

    test("shows a validation error when the pilot question is not answered", async ({
      page,
    }) => {
      const { crn, moci } = await openExistingTierSetup(page, "A");
      const message =
        "Select if you have one or more people who started using online check ins before 1 October 2026";
      await moci.eligibilityCheck.completePage(["none"]);
      await assertManageCheckinsPage(page, crn, PILOT_CHECK_TITLE);

      await moci.pilotCheck.continueWithoutAnswering();

      await expect(moci.pilotCheck.errorSummary()).toContainText(message);
      await expect(moci.pilotCheck.fieldError(message)).toBeVisible();
      await assertManageCheckinsPage(page, crn, errorTitle(PILOT_CHECK_TITLE));
    });
  });
});
test.describe("Schedule an ad hoc check in ", () => {
  test("shows errors for an empty, wrongly formatted or past date", async ({
    page,
  }) => {
    const journey = new ManageCheckInsJourney(page);
    const date = new ManageCheckinsPages(page).scheduleCheckInDate;
    await journey.login();
    const manage = await journey.openManage(adhocCrn);
    await expect(
      manage.scheduleCheckInButton(),
      "TEST_ADHOC_CRN should be on ad hoc check ins with nothing booked ",
    ).toBeVisible();
    await manage.scheduleCheckInButton().click();
    await date.assertOnPage();

    const cases = [
      {
        name: "empty",
        input: "",
        error:
          "Enter the date you would like the person to complete their online check in",
      },
      {
        name: "wrong-format",
        input: "31/02/2026",
        error: "Enter a date in the correct format, for example 17/5/2024",
      },
      {
        name: "in the past",
        input: firstCheckinDateString(-1),
        error: "The online check in date must be today or in the future",
      },
    ];
    for (const { name, input, error } of cases) {
      await test.step(`${name} shows an error`, async () => {
        await date.completePage(input);
        await expect(date.errorSummary()).toContainText(error);
        await expect(date.fieldError(error)).toBeVisible();
      });
    }
  });
});
test("schedule a check in date page shows errors for an empty, wrongly formatted or past date", async ({
  page,
}) => {
  const journey = new ManageCheckInsJourney(page);
  const date = new ManageCheckinsPages(page).scheduleCheckInDate;
  await journey.login();
  const manage = await journey.openManage(adhocCrn);
  await manage.scheduleCheckInButton().click();
  await date.assertOnPage();

  const cases = [
    {
      name: "empty",
      input: "",
      error:
        "Enter the date you would like the person to complete their online check in",
    },
    {
      name: "wrong-format",
      input: "31/02/2026",
      error: "Enter a date in the correct format, for example 17/5/2024",
    },
    {
      name: "in the past",
      input: firstCheckinDateString(-1),
      error: "The online check in date must be today or in the future",
    },
  ];
  for (const { name, input, error } of cases) {
    await test.step(`${name} shows an error`, async () => {
      await date.completePage(input);
      await expect(date.errorSummary()).toContainText(error);
      await expect(date.fieldError(error)).toBeVisible();
    });
  }
});
