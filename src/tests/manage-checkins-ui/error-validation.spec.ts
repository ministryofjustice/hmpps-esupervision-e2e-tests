import test, { expect } from "@playwright/test";
import {
  ensureMpopLogin,
  getSharedNewUiCheckinOffender,
} from "../../support/utils/sharedActiveCheckinOffender";
import ManageCheckInsJourney from "../../support/journeys/mpop/manageCheckinsJourney";
import { MpopPages } from "../../support/pages/mpop/mpopPages";
import { ManageCheckinsUiPages } from "../../support/pages/manage-checkins-ui/manageCheckinsUiPages";

test("shows validation errors when changing contact details on new UI", async ({
  page,
}) => {
  const offender = await getSharedNewUiCheckinOffender(page);
  const crn = offender.crn;

  const manage = new ManageCheckInsJourney(page);
  const mpopPages = new MpopPages(page);
  const newUiPages = new ManageCheckinsUiPages(page);

  await manage.openManage(crn);
  await mpopPages.manage.clickChangeContactDetails();
  await newUiPages.contactDetails.changeEmailAddressButton().click();

  await newUiPages.editContactDetails.emailAddressField().fill("");
  await newUiPages.editContactDetails.save();
  await expect(newUiPages.editContactDetails.errorSummary()).toContainText(
    "Enter a mobile number",
  );
  await expect(newUiPages.editContactDetails.errorSummary()).toContainText(
    "Enter an email address",
  );
  await expect(
    newUiPages.editContactDetails.fieldError("Enter a mobile number"),
  ).toBeVisible();
  await expect(
    newUiPages.editContactDetails.fieldError("Enter an email address"),
  ).toBeVisible();

  await newUiPages.editContactDetails.emailAddressField().fill("not-an-email");
  await newUiPages.editContactDetails.save();
  await expect(newUiPages.editContactDetails.errorSummary()).toContainText(
    "Enter an email address in the correct format.",
  );
  await expect(
    newUiPages.editContactDetails.fieldError(
      "Enter an email address in the correct format.",
    ),
  ).toBeVisible();
});

test("shows a validation error when adding a custom question with no question text on new UI", async ({
  page,
}) => {
  const offender = await getSharedNewUiCheckinOffender(page);
  const crn = offender.crn;

  const manage = new ManageCheckInsJourney(page);
  await ensureMpopLogin(page);
  const mpopPages = new MpopPages(page);

  const manageQ = await manage.openManage(crn);
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

test("shows validation errors when stopping check ins with no reason on new UI", async ({
  page,
}) => {
  const offender = await getSharedNewUiCheckinOffender(page);
  const crn = offender.crn;

  const manage = new ManageCheckInsJourney(page);
  await ensureMpopLogin(page);
  const mpopPages = new MpopPages(page);

  const manageStop = await manage.openManage(crn);
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
