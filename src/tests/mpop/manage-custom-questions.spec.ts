import test from "@playwright/test";
import { NewOffender } from "../../data/delius/types";
import { createCheckinOffender } from "../../support/fixtures/checkinOffender";
import { getToken } from "../../api/auth";
import { deleteAssignedQuestions } from "../../api/checkin";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import CustomQuestionsJourney from "../../support/journeys/mpop/customQuestionsJourney";
import { CustomQuestion } from "../../data/models";

const CUSTOM_QUESTIONS: CustomQuestion[] = [
  { template: "been going recently", text: "apprenticeship" },
  { template: "been feeling", text: "relationships with family" },
  { template: "How is", text: "recovery" },
];
const QUESTION_TEXTS = CUSTOM_QUESTIONS.map((q) => q.text);
const EDITED_QUESTION = "training";

// Serial: the second test depends on the questions the first one saves, so both
// share this spec's own offender.
test.describe.serial("Manage custom check in questions", () => {
  let offender: NewOffender;

  test.beforeAll(async ({ browser }) => {
    offender = await createCheckinOffender(browser);
  });

  // afterAll, not afterEach - clearing between the tests would break the serial
  // flow. Tidiness only; the offender is this spec's own.
  test.afterAll(async () => {
    if (!offender) return;
    await deleteAssignedQuestions(offender.crn, await getToken());
  });

  test("practitioner adds three custom questions and saves them on the upcoming check in", async ({
    page,
  }, testInfo) => {
    const crn = offender.crn;
    await attachCreatedCrn(testInfo, crn);
    const journey = new CustomQuestionsJourney(page);
    await journey.login();
    await journey.addCustomQuestions(crn, CUSTOM_QUESTIONS);
  });

  test("practitioner edits, deletes and clears custom question so none remain saved", async ({
    page,
  }, testInfo) => {
    const crn = offender.crn;
    await attachCreatedCrn(testInfo, crn);
    const journey = new CustomQuestionsJourney(page);
    await journey.login();
    const remaining = await journey.editAndDeleteCustomQuestions(
      crn,
      QUESTION_TEXTS,
      {
        from: QUESTION_TEXTS[0],
        to: EDITED_QUESTION,
        template: CUSTOM_QUESTIONS[0].template,
      },
      QUESTION_TEXTS[1],
    );

    await journey.clearCustomQuestions(crn, remaining);
  });
});
