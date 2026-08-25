import test, { expect } from "@playwright/test";
import { NewOffender } from "../../data/delius/types";
import { createCheckinOffender } from "../../support/fixtures/checkinOffender";
import { getToken } from "../../api/auth";
import { deleteAssignedQuestions } from "../../api/checkin";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import ManageCheckInsJourney from "../../support/journeys/mpop/manageCheckinsJourney";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import { firstCheckinDateString } from "../../support/utils/date";
import { env } from "../../config/env";
import { MpopPages } from "../../support/pages/mpop/mpopPages";
import { ManageCheckinsUiPages } from "../../support/pages/manage-checkins-ui/manageCheckinsUiPages";
import { LEGACY_MPOP } from "../../support/utils/legacyMpop";

// Despite the folder, only the contact details test is MOCI-only; questions, stop,
// and date run against whichever service is targeted (move them out if this file
// is ever narrowed to MOCI).
//
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
  test("shows validation errors when changing contact details", async ({
    page,
  }, testInfo) => {
    // TODO(legacy-mpop): remove this skip once legacy MPOP is gone.
    test.skip(
      LEGACY_MPOP,
      "MOCI only: MPOP has no manage-page edit contact details flow",
    );

    await attachCreatedCrn(testInfo, offender.crn);

    const manage = new ManageCheckInsJourney(page);
    await manage.login();
    const manageCheckinsPages = new ManageCheckinsUiPages(page);

    const managePage = await manage.openManage(offender.crn);
    await managePage.clickChangeContactDetails();
    await manageCheckinsPages.contactDetails.changeEmailAddressButton().click();

    // Clear both fields - clearing only email would depend on this offender having no mobile.
    await manageCheckinsPages.editContactDetails.mobileNumberField().fill("");
    await manageCheckinsPages.editContactDetails.emailAddressField().fill("");
    await manageCheckinsPages.editContactDetails.save();
    await expect(
      manageCheckinsPages.editContactDetails.errorSummary(),
    ).toContainText("Enter a mobile number");
    await expect(
      manageCheckinsPages.editContactDetails.errorSummary(),
    ).toContainText("Enter an email address");
    await expect(
      manageCheckinsPages.editContactDetails.fieldError(
        "Enter a mobile number",
      ),
    ).toBeVisible();
    await expect(
      manageCheckinsPages.editContactDetails.fieldError(
        "Enter an email address",
      ),
    ).toBeVisible();

    await manageCheckinsPages.editContactDetails
      .emailAddressField()
      .fill("not-an-email");
    await manageCheckinsPages.editContactDetails.save();
    const emailFormat = "Enter an email address in the correct format.";
    await expect(
      manageCheckinsPages.editContactDetails.errorSummary(),
    ).toContainText(emailFormat);
    await expect(
      manageCheckinsPages.editContactDetails.fieldError(emailFormat),
    ).toBeVisible();
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

  // Uses TEST_MPOP_CRN, not this spec's offender - the wizard is abandoned before
  // completing setup, so no check in state changes. Verified that an abandoned
  // wizard leaves no resumable draft, so it's safe to share this CRN with
  // eligibility-outcomes.
  test("rejects a first check in date that is in the past or malformed", async ({
    page,
  }) => {
    const journey = new SetupOnlineCheckinsJourney(page);
    await journey.login();
    await journey.startSetup(env.mpopTestCrn());
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
});
