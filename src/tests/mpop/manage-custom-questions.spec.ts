import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import { firstCheckinDateString } from "../../support/utils/date";
import { cleanupCrns } from "../../scripts/cleanupCrns";
import {
  readCreatedCrns,
  writeCreatedCrns,
} from "../../support/utils/createdCrns";
import test from "@playwright/test";
import ManageCheckInsJourney, {
  CustomQuestion,
} from "../../support/journeys/mpop/manageCheckinsJourney";

test.describe.serial("Manage custom check in questions", () => {
  const CUSTOM_QUESTIONS: CustomQuestion[] = [
    { template: "been going recently", text: "apprenticeship" },
    { template: "been feeling", text: "relationships with family" },
    { template: "How is", text: "recovery" },
  ];
  const QUESTION_TEXTS = CUSTOM_QUESTIONS.map((q) => q.text);
  const EDITED_QUESTION = "training";
  let crn: string;
  let mpopPassed = true;

  test("practitioner adds three custom questions and saves them on the upcoming check in", async ({
    page,
  }) => {
    const offender = await new OnlineCheckinJourney(
      page,
    ).createOffenderAndSetupCheckins(firstCheckinDateString(7));
    crn = offender.crn;
    await new ManageCheckInsJourney(page).addCustomQuestions(
      crn,
      CUSTOM_QUESTIONS,
    );
  });

  test("practitioner edits, deletes and clears custom question so none remain saved", async ({
    page,
  }) => {
    const journey = new ManageCheckInsJourney(page);
    await journey.login();
    const remaining = await journey.editAndDeleteCustomQuestions(
      crn,
      QUESTION_TEXTS,
      { from: QUESTION_TEXTS[0], to: EDITED_QUESTION },
      QUESTION_TEXTS[1],
    );

    await journey.clearCustomQuestions(crn, remaining);
  });

  test.afterEach(() => {
    const testInfo = test.info();
    if (testInfo.status !== testInfo.expectedStatus) {
      mpopPassed = false;
    }
  });

  test.afterAll(async () => {
    const crns = readCreatedCrns();
    if (crns.length === 0) return;

    if (!mpopPassed) {
      console.log(
        `mpop questions spec failed - keeping ${crns.length} offender(s) for investigation: ${crns.join(",")}`,
      );
      return;
    }

    const failed = await cleanupCrns(crns);
    writeCreatedCrns(failed);
    console.log(
      failed.length > 0
        ? `Cleanup: ${failed.length} offender(s) could not be deleted: ${failed.join(",")}`
        : "Cleanup: all created offenders removed",
    );
  });
});
