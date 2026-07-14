import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import { firstCheckinDateString } from "../../support/utils/date";
import test from "@playwright/test";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import CustomQuestionsJourney from "../../support/journeys/mpop/customQuestionsJourney";
import { CustomQuestion } from "../../data/models";

test.describe.serial("Manage custom check in questions", () => {
  const CUSTOM_QUESTIONS: CustomQuestion[] = [
    { template: "been going recently", text: "apprenticeship" },
    { template: "been feeling", text: "relationships with family" },
    { template: "How is", text: "recovery" },
  ];
  const QUESTION_TEXTS = CUSTOM_QUESTIONS.map((q) => q.text);
  const EDITED_QUESTION = "training";
  let crn: string;

  test("practitioner adds three custom questions and saves them on the upcoming check in", async ({
    page,
  }, testInfo) => {
    const offender = await new OnlineCheckinJourney(
      page,
    ).createOffenderAndSetupCheckins(firstCheckinDateString(7));
    crn = offender.crn;
    await attachCreatedCrn(testInfo, offender.crn);
    await new CustomQuestionsJourney(page).addCustomQuestions(
      crn,
      CUSTOM_QUESTIONS,
    );
  });

  test("practitioner edits, deletes and clears custom question so none remain saved", async ({
    page,
  }, testInfo) => {
    const journey = new CustomQuestionsJourney(page);
    await journey.login();
    await attachCreatedCrn(testInfo, crn);
    const remaining = await journey.editAndDeleteCustomQuestions(
      crn,
      QUESTION_TEXTS,
      { from: QUESTION_TEXTS[0], to: EDITED_QUESTION },
      QUESTION_TEXTS[1],
    );

    await journey.clearCustomQuestions(crn, remaining);
  });
});
