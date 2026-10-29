import test from "@playwright/test";
import { env } from "../../config/env";
import { getToken } from "../../api/auth";
import { deleteAssignedQuestions } from "../../api/checkin";
import CustomQuestionsJourney from "../../support/journeys/manage-online-checkins-ui/customQuestionsJourney";
import { CustomQuestion, QuestionToAdd } from "../../data/models";
import { assertActiveManageCrn } from "../../support/assertions/api/supervisionPackageAPI";

const TEMPLATE_QUESTION_TO_EDIT: CustomQuestion = {
  template: "been going recently",
  text: "apprenticeship",
};

const BESPOKE_QUESTION_TO_EDIT: QuestionToAdd = {
  text: "What are you most looking forward to this week",
};

const CUSTOM_QUESTIONS: QuestionToAdd[] = [
  TEMPLATE_QUESTION_TO_EDIT,
  { template: "been feeling", text: "relationships with family" },
  BESPOKE_QUESTION_TO_EDIT,
];
const QUESTION_TEXTS = CUSTOM_QUESTIONS.map((q) => q.text);
const EDITED_QUESTION = "training";
const EDITED_BESPOKE_QUESTION = "What are your plans about your job search";

// Serial: the second test depends on the questions the first one saves.
test.describe.serial("Manage custom check in questions", () => {
  const crn = env.manageCrn();
  let cleanBaselineVerified = false;

  test.beforeAll(async ({ browser }) => {
    await assertActiveManageCrn(crn);
    const page = await browser.newPage();
    try {
      const journey = new CustomQuestionsJourney(page);
      await journey.login();
      await journey.assertNoCustomQuestions(crn);
      cleanBaselineVerified = true;
    } finally {
      await page.close();
    }
  });

  // Only clean up after confirming this spec owns an initially empty question set.
  test.afterAll(async () => {
    if (!cleanBaselineVerified) return;
    await deleteAssignedQuestions(crn, await getToken());
  });

  test("practitioner adds three custom questions and saves them on the upcoming check in", async ({
    page,
  }) => {
    const journey = new CustomQuestionsJourney(page);
    await journey.login();
    // Folded in rather than given its own test: checking the intro page's links
    // needs the same login and walk through the manage page as adding questions.
    await journey.assertAddQuestionsPageLinks(crn);
    await journey.addCustomQuestions(crn, CUSTOM_QUESTIONS);
  });

  test("practitioner edits, deletes and clears custom question so none remain saved", async ({
    page,
  }) => {
    const journey = new CustomQuestionsJourney(page);
    await journey.login();
    const remaining = await journey.editAndDeleteCustomQuestions(
      crn,
      QUESTION_TEXTS,
      [
        {
          from: TEMPLATE_QUESTION_TO_EDIT.text,
          to: EDITED_QUESTION,
          template: TEMPLATE_QUESTION_TO_EDIT.template,
        },
        { from: BESPOKE_QUESTION_TO_EDIT.text, to: EDITED_BESPOKE_QUESTION },
      ],
      QUESTION_TEXTS[1],
    );

    await journey.clearCustomQuestions(crn, remaining);
  });
});
