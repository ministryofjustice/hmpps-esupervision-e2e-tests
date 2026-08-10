import { test } from "@playwright/test";
import {
  randomMentalHealthOption,
  randomAssistanceSelections,
} from "../../data/models";
import CheckinJourney from "../../support/journeys/checkinJourney";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import { label } from "../../data/labels";
import { getToken } from "../../api/auth";
import { createEsupervisionCheckin } from "../../api/checkin";
import {
  dueDateString,
  today,
  firstCheckinDateString,
} from "../../support/utils/date";
import { attachCreatedCrn } from "../../support/utils/createdCrns";

// Randomised per run, the chosen values are logged below so
// a failing run can be reproduced manually
const mentalHealth = randomMentalHealthOption();
const assistance = randomAssistanceSelections(2);

/** We do not run the real AWS face liveness check. The recording step is driven with a fake camera
  (see playwright.config.ts launch args). The recorded video does not match and return NO_MATCH.
 The journey takes 'submit video anyway'
 path so the check in can still complete**/

test("video fallback: no match, submit anyway, checkin completes", async ({
  page,
}, testInfo) => {
  const onlineCheckin = new OnlineCheckinJourney(page);
  const offender = await onlineCheckin.createOffenderAndSetupCheckins(
    firstCheckinDateString(0),
  );
  await attachCreatedCrn(testInfo, offender.crn);

  const token = await getToken();
  const uuid = await createEsupervisionCheckin(
    offender.crn,
    dueDateString(today),
    token,
  );
  console.log(`uuid=${uuid} feelingQuestion=${mentalHealth}
    support=${assistance.map((a) => a.option).join("+")}`);

  const journey = new CheckinJourney(page);
  await journey.navigateToCheckin(uuid);
  await journey.clickStart();
  await journey.completePersonalDetails(offender.person);
  await journey.completeMentalHealthQuestion(mentalHealth);
  await journey.completeAssistanceQuestion(assistance);
  await journey.completeFallbackVideoNoMatchFlow(uuid, {
    onNoMatchScreen: (heading) =>
      journey.verifyHeadingContainsText(
        heading,
        "We cannot confirm this is you",
        "No match heading must show 'We cannot confirm this is you'",
      ),
  });
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
