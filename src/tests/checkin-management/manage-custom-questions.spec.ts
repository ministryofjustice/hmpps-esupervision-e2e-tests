import test, { Page } from "@playwright/test";
import { attachCreatedCrn } from "../../support/utils/createdCrns";
import {
  ensureMpopLogin,
  getSharedActiveCheckinOffender,
  getSharedNewUiCheckinOffender,
} from "../../support/utils/sharedActiveCheckinOffender";
import CustomQuestionsJourney from "../../support/journeys/mpop/customQuestionsJourney";
import { CustomQuestion } from "../../data/models";
import { NewOffender } from "../../data/delius/types";
import { ExpectedUi } from "../../support/utils/expectedUi";

const CUSTOM_QUESTIONS: CustomQuestion[] = [
  { template: "been going recently", text: "apprenticeship" },
  { template: "been feeling", text: "relationships with family" },
  { template: "How is", text: "recovery" },
];
const QUESTION_TEXTS = CUSTOM_QUESTIONS.map((q) => q.text);
const EDITED_QUESTION = "training";

// Remove the MPOP entry once online check in questions are fully migrated to
// manage-checkins-ui - the "new UI" entry alone will then cover this flow.
const UI_VARIANTS: {
  name: string;
  expectedUi?: ExpectedUi;
  getOffender: (page: Page) => Promise<NewOffender>;
}[] = [
  { name: "MPOP", getOffender: getSharedActiveCheckinOffender },
  {
    name: "new UI",
    expectedUi: "newUi",
    getOffender: getSharedNewUiCheckinOffender,
  },
];

for (const variant of UI_VARIANTS) {
  test.describe
    .serial(`Manage custom check in questions on ${variant.name}`, () => {
    let crn: string;

    test(`practitioner adds three custom questions and saves them on the upcoming check in (${variant.name})`, async ({
      page,
    }, testInfo) => {
      const offender = await variant.getOffender(page);
      crn = offender.crn;
      await attachCreatedCrn(testInfo, offender.crn);
      await ensureMpopLogin(page);
      await new CustomQuestionsJourney(page).addCustomQuestions(
        crn,
        CUSTOM_QUESTIONS,
        variant.expectedUi,
      );
    });

    test(`practitioner edits, deletes and clears custom question so none remain saved (${variant.name})`, async ({
      page,
    }, testInfo) => {
      const journey = new CustomQuestionsJourney(page);
      await journey.login();
      await attachCreatedCrn(testInfo, crn);
      const remaining = await journey.editAndDeleteCustomQuestions(
        crn,
        QUESTION_TEXTS,
        {
          from: QUESTION_TEXTS[0],
          to: EDITED_QUESTION,
          template: CUSTOM_QUESTIONS[0].template,
        },
        QUESTION_TEXTS[1],
        variant.expectedUi,
      );

      await journey.clearCustomQuestions(crn, remaining, variant.expectedUi);
    });
  });
}
