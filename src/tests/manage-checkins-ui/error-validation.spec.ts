import test, { expect } from "@playwright/test";
import { NewOffender } from "../../data/delius/types";
import { createCheckinOffender } from "../../support/fixtures/checkinOffender";
import { getToken } from "../../api/auth";
import { deleteAssignedQuestions } from "../../api/checkin";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import ManageCheckInsJourney from "../../support/journeys/mpop/manageCheckinsJourney";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import DeliusOffenderJourney from "../../support/journeys/ndelius/deliusOffenderJourney";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import { firstCheckinDateString } from "../../support/utils/date";
import { MpopPages } from "../../support/pages/mpop/mpopPages";
import { ManageCheckinsUiPages } from "../../support/pages/manage-checkins-ui/manageCheckinsUiPages";
import { LEGACY_MPOP } from "../../support/utils/legacyMpop";

// Questions and stop tests skip assertExpectedService (they reach pages directly),
// so a flag/LEGACY_MPOP mismatch shows as a selector timeout, not a clear error.
//
// Owns its offender: the questions test clears assigned questions first, which
// would conflict with any other spec sharing it.
let offender: NewOffender;

test.beforeAll(async ({ browser }) => {
  offender = await createCheckinOffender(browser);
});

test.describe("Validation errors", () => {
  test.describe("Change contact details", () => {
    // Kept deliberately minimal - the manage-page contact details flow is
    // expected to change again soon, so this covers only the core rule
    // (required field tracks the offender's saved preference) rather than
    // every format/persistence permutation.
    test("only the field matching the offender's saved preference is required", async ({
      page,
    }, testInfo) => {
      // TODO(legacy-mpop): Delete this skip when legacy MPOP is removed - the test
      // then always runs. MPOP's edit page validates the mobile and email fields
      // together regardless of preference, so this rule is MOCI only.
      test.skip(
        LEGACY_MPOP,
        "MOCI only: MPOP validates mobile and email together, not per preference",
      );
      await attachCreatedCrn(testInfo, offender.crn);

      const manage = new ManageCheckInsJourney(page);
      await manage.login();
      const manageCheckinsPages = new ManageCheckinsUiPages(page);

      const managePage = await manage.openManage(offender.crn);
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
  }, testInfo) => {
    await attachCreatedCrn(testInfo, offender.crn);

    // Clear questions first - at MAX_CUSTOM_QUESTIONS the Add question button disappears.
    await deleteAssignedQuestions(offender.crn, await getToken());

    const manage = new ManageCheckInsJourney(page);
    await manage.login();
    const mpopPages = new MpopPages(page);

    const manageQ = await manage.openManage(offender.crn);
    // Questions are only editable if the next check in is in the future.
    await expect(
      manageQ.changeQuestionsLink(),
      "Shared offender needs a future check in for questions to be editable",
    ).toBeVisible();
    await manageQ.clickChangeQuestions();
    await mpopPages.howToWriteQuestions.clickAddQuestions();
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
  }, testInfo) => {
    await attachCreatedCrn(testInfo, offender.crn);

    const manage = new ManageCheckInsJourney(page);
    await manage.login();
    const mpopPages = new MpopPages(page);

    const manageStop = await manage.openManage(offender.crn);
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
    // Own offender per test, not this spec's shared one: these reach the setup
    // wizard directly and don't need an active check in already set up.
    test("rejects a first check in date that is in the past or malformed", async ({
      page,
    }, testInfo) => {
      const dateOffender = await new DeliusOffenderJourney(
        page,
      ).createTestOffender();
      await attachCreatedCrn(testInfo, dateOffender.crn);

      const journey = new SetupOnlineCheckinsJourney(page);
      await journey.login();
      await journey.startSetup(dateOffender.crn);
      const dateFrequency = await journey.completeSetupToDateFrequency({
        eligibilityIds: [9],
        rationale: "E2E test rationale",
      });

      const pastDate =
        "The first online check in date must be today or in the future";
      await dateFrequency.changePage(
        firstCheckinDateString(-7),
        FrequencyOptions.EVERY_WEEK,
      );
      await expect(dateFrequency.errorSummary()).toContainText(pastDate);
      await expect(dateFrequency.fieldError(pastDate)).toBeVisible();
      await dateFrequency.assertOnPage();

      // 31 February looks well-formed but isn't a real date - same error either way.
      const badFormat =
        "Enter a date in the correct format, for example 17/5/2024";
      await dateFrequency.changePage("31/2/2026");
      await expect(dateFrequency.errorSummary()).toContainText(badFormat);
      await expect(dateFrequency.fieldError(badFormat)).toBeVisible();
      await dateFrequency.assertOnPage();
    });

    test("shows validation errors when the check in date and frequency are left blank", async ({
      page,
    }, testInfo) => {
      const dateOffender = await new DeliusOffenderJourney(
        page,
      ).createTestOffender();
      await attachCreatedCrn(testInfo, dateOffender.crn);

      const journey = new SetupOnlineCheckinsJourney(page);
      await journey.login();
      await journey.startSetup(dateOffender.crn);
      const dateFrequency = await journey.completeSetupToDateFrequency({
        eligibilityIds: [9],
        rationale: "E2E test rationale",
      });

      // Neither field has been filled yet on this fresh page.
      const noDate =
        "Enter the date you would like the person to complete their first check in";
      const noFrequency =
        "Select how often you would like the person to check in";
      await dateFrequency.changePage("");
      await expect(dateFrequency.errorSummary()).toContainText(noDate);
      await expect(dateFrequency.errorSummary()).toContainText(noFrequency);
      await expect(dateFrequency.fieldError(noDate)).toBeVisible();
      await expect(dateFrequency.fieldError(noFrequency)).toBeVisible();
      await dateFrequency.assertOnPage();
    });
  });
});
