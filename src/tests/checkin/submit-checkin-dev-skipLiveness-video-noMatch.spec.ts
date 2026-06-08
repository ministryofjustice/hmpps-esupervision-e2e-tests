import { test } from "@playwright/test";
import {
  randomMentalHealthOption,
  randomAssistanceSelections,
} from "../../support/data/models";
import CheckinJourney from "../../support/journeys/checkin-ui/checkinJourney";
import { label } from "../../support/data/labels";
import { getToken } from "../api/clientToken";
import { createEsupervisionCheckin } from "../api/createCheckin";
import { dueDateString, today } from "../../support/utils/date";

const crn = process.env.TEST_CRN!

const person = {
  firstName: process.env.TEST_PERSON_FIRST_NAME!,
  lastName: process.env.TEST_PERSON_LAST_NAME!,
  dob:new Date(process.env.TEST_PERSON__DOB!)
}
let uuid: string;

const mentalHealth = randomMentalHealthOption();
const assistance = randomAssistanceSelections(2);

test.beforeAll(async () => {
  const token = await getToken();
  uuid = await createEsupervisionCheckin(crn, dueDateString(today), token);
  console.log(` Checkin created — UUID: ${uuid}`);
  console.log(`URL: ${process.env.PROBATION_CHECK_IN_URL}/${uuid}`);
});

test("video submission NO MATCH-> check-your-answers->confirmation", async ({ page }) => {
  const journey = new CheckinJourney(page);
  await journey.navigateToCheckin(uuid);
  await journey.clickStart();
  console.log(process.env.ENV);
  console.log(person);
  await journey.completePersonalDetails(person);
  await journey.completeMentalHealthQuestion(mentalHealth);
  await journey.completeAssistanceQuestion(assistance);
  await journey.verifyOnInformPage()
  await journey.completeVideoRecordNoMatchFlow(uuid)
  await journey.verifyCheckAnswersPage();
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
  await journey.submitCheckin()
  await journey.verifyConfirmationPage()
});
