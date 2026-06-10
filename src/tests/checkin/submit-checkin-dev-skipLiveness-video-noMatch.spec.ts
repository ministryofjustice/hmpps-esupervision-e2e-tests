import { test } from "@playwright/test";
import {
  randomMentalHealthOption,
  randomAssistanceSelections,
} from "../../data/models";
import CheckinJourney from "../../support/journeys/checkinJourney";
import { label } from "../../data/labels";
import { getToken } from "../../api/auth";
import { createEsupervisionCheckin } from "../../api/checkin";
import { dueDateString, today } from "../../support/utils/date";
import { env } from "../../config/env";

const crn = env.testCrn();
const personDetails = env.testPerson();

const person = {
  firstName: personDetails.firstName,
  lastName: personDetails.lastName,
  dob: new Date(personDetails.dob),
};

// Randomised per run, the chosen values are logged below so
// a failing run can be reproduced manually
const mentalHealth = randomMentalHealthOption();
const assistance = randomAssistanceSelections(2);

let uuid: string;

test.beforeAll(async () => {
  const token = await getToken();
  uuid = await createEsupervisionCheckin(crn, dueDateString(today), token);
  console.log(`uuid=${uuid} feelingQuestion=${mentalHealth} 
    support=${assistance.map((a) => a.option).join("+")}`);
});

/** We do not run the real AWS face liveness check. The recording step is driven with a fake camera 
  (see playwright.config.ts launch args). The recorded video does not match and return NO_MATCH. 
 The journey takes 'submit video anyway'
 path so teh check in can still complete**/

test("video submission NO MATCH-> check-your-answers->confirmation", async ({
  page,
}) => {
  const journey = new CheckinJourney(page);
  await journey.navigateToCheckin(uuid);
  await journey.clickStart();
  await journey.completePersonalDetails(person);
  await journey.completeMentalHealthQuestion(mentalHealth);
  await journey.completeAssistanceQuestion(assistance);
  await journey.completeVideoRecordNoMatchFlow(uuid);
  await journey.verifyCheckAnswersPage();
  await journey.verifySummaryContains(
    "How have you been feeling since we last spoke?",
    label(mentalHealth),
  );
  await journey.verifyAssistanceCommentsInSummary(assistance);
  await journey.changeAnswer("How have you been feeling since we last spoke?");
  await journey.completeMentalHealthQuestion("OK");
  await journey.verifySummaryContains(
    "How have you been feeling since we last spoke?",
    label("OK"),
  );
  await journey.submitCheckin();
  await journey.verifyConfirmationPage();
});
