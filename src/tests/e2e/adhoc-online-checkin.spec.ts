import { expect, Page, test } from "@playwright/test";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import ManageCheckInsJourney from "../../support/journeys/manage-online-checkins-ui/manageCheckinsJourney";
import CustomQuestionsJourney from "../../support/journeys/manage-online-checkins-ui/customQuestionsJourney";
import { ManageCheckinsPages } from "../../support/pages/manage-online-checkins-ui/manageCheckinsPages";
import CheckInConfirmationPage from "../../support/pages/manage-online-checkins-ui/checkInConfirmationPage";
import { FrequencyOptions } from "../../support/pages/manage-online-checkins-ui/checkInFrequencyPage";
import { IdentityDecision } from "../../support/pages/manage-online-checkins-ui/reviewIdentityPage";
import { getToken } from "../../api/auth";
import { waitForAwaitingCheckinUuid } from "../../support/utils/waitForCheckin";
import {
  displayedCheckinDatePattern,
  firstCheckinDateString,
} from "../../support/utils/date";
import { NewOffender } from "../../data/delius/types";
import { CustomQuestion, QuestionToAdd } from "../../data/models";

/**
 * Confirmation page (ad hoc) -> Schedule a check in -> date -> questions ->
 * Create. Any questions given are added on the questions page first.
 */
async function scheduleFromConfirmation(
  page: Page,
  daysAhead: number,
  questions: QuestionToAdd[] = [],
): Promise<void> {
  const pages = new ManageCheckinsPages(page);
  const confirmation = new CheckInConfirmationPage(page);

  await test.step("Confirmation page shows no start date and a Schedule a check in button", async () => {
    await confirmation.assertOnPage();
    await expect(confirmation.panel()).toBeVisible();
    await expect(confirmation.panel()).not.toContainText("Starting");
    await expect(confirmation.scheduleCheckInButton()).toBeVisible();
    await confirmation.clickScheduleCheckIn();
  });

  await test.step("Schedule a check in", async () => {
    await pages.scheduleCheckInDate.assertOnPage();
    await pages.scheduleCheckInDate.completePage(
      firstCheckinDateString(daysAhead),
    );
    await pages.scheduleCheckInQuestions.assertOnPage();
    const customQuestions = new CustomQuestionsJourney(page);
    for (const question of questions) {
      await customQuestions.addQuestion(
        pages.scheduleCheckInQuestions,
        question,
      );
    }
    await pages.scheduleCheckInQuestions.clickCreate();
  });
}

async function assertAdHocCheckInScheduled(
  page: Page,
  offender: NewOffender,
  daysAhead: number,
): Promise<void> {
  const manage = new ManageCheckinsPages(page).manage;
  const expectedDate = displayedCheckinDatePattern(daysAhead);
  await test.step("Manage page shows the booked check in", async () => {
    await manage.assertOnPage();
    await expect(manage.successBanner()).toContainText(
      `Single online check in for ${offender.person.firstName} has been created`,
    );
    await expect(manage.successBanner()).toContainText(expectedDate);
    await expect(manage.settingsFrequency()).toHaveText(
      "I'll schedule them one at a time",
    );
    await expect(manage.nextCheckinDate()).toContainText(expectedDate);
    await expect(manage.scheduleCheckInButton()).toBeHidden();
  });
}

const QUESTION: CustomQuestion = {
  template: "How is",
  text: "your health",
};

const BESPOKE_QUESTION: QuestionToAdd = {
  text: "What are your plans about job hunting",
};

test.describe("Ad hoc online check ins", () => {
  test("practitioner sets up ad hoc check ins, schedules a check in for tomorrow with a custom question, then reschedules it and the question is kept", async ({
    page,
  }) => {
    const journey = new OnlineCheckinJourney(page);
    const offender = await journey.createOffenderAndSetupCheckins(undefined, {
      frequency: FrequencyOptions.AD_HOC,
    });

    await scheduleFromConfirmation(page, 1, [QUESTION, BESPOKE_QUESTION]);
    await assertAdHocCheckInScheduled(page, offender, 1);

    const moci = new ManageCheckinsPages(page);
    await expect(
      moci.manage.questionCard(),
      "The question added while scheduling is visible",
    ).toContainText(QUESTION.text);
    await expect(
      moci.manage.questionCard(),
      "The bespoke question added while scheduling is visible",
    ).toContainText(`${BESPOKE_QUESTION.text}?`);
    await expect(
      moci.manage.changeNextCheckinDateLink(),
      "A check in still to come can be moved",
    ).toBeVisible();

    await test.step("Change opens the schedule page with the booked date filled in", async () => {
      await moci.manage.clickChangeNextCheckinDate();
      await moci.scheduleCheckInDate.assertOnPage();
      await expect(moci.scheduleCheckInDate.dateInput()).toHaveValue(
        firstCheckinDateString(1),
      );
    });

    await test.step("A booked check in cannot be moved to today", async () => {
      const error = "The next online check in date must be in the future";
      await moci.scheduleCheckInDate.completePage(firstCheckinDateString(0));
      await expect(moci.scheduleCheckInDate.errorSummary()).toContainText(
        error,
      );
      await expect(moci.scheduleCheckInDate.fieldError(error)).toBeVisible();
    });

    await test.step("Moving the date saves straight away, without the questions page", async () => {
      await moci.scheduleCheckInDate.completePage(firstCheckinDateString(3));
      await moci.manage.assertOnPage();
      await expect(moci.manage.successBanner()).toContainText(
        `Single online check in for ${offender.person.firstName} has been moved to`,
      );
      await expect(moci.manage.successBanner()).toContainText(
        displayedCheckinDatePattern(3),
      );
      await expect(moci.manage.settingsNextCheckinDate()).toContainText(
        displayedCheckinDatePattern(3),
      );
      await expect(
        moci.manage.questionCard(),
        "The question added while scheduling is still visible after rescheduling",
      ).toContainText(QUESTION.text);
      await expect(
        moci.manage.questionCard(),
        "The bespoke question is still visible after rescheduling",
      ).toContainText(`${BESPOKE_QUESTION.text}?`);
    });

    await journey.assertOverviewNextCheckin(
      offender.crn,
      displayedCheckinDatePattern(3),
    );
  });

  test("practitioner schedules an ad hoc check in for today with a question, the person completes it and the practitioner reviews it", async ({
    page,
  }) => {
    const journey = new OnlineCheckinJourney(page);
    const offender = await journey.createOffenderAndSetupCheckins(undefined, {
      frequency: FrequencyOptions.AD_HOC,
    });

    await scheduleFromConfirmation(page, 0, [QUESTION]);
    await assertAdHocCheckInScheduled(page, offender, 0);

    const manage = new ManageCheckinsPages(page).manage;
    await expect(
      manage.changeNextCheckinDateLink(),
      "An active check in cannot be moved",
    ).toHaveCount(0);

    const token = await getToken();
    const checkinUuid = await waitForAwaitingCheckinUuid(offender.crn, token);
    // The person is asked the question added while scheduling.
    const details = await journey.completeCheckin(checkinUuid, offender, [
      QUESTION.text,
    ]);

    await journey.reviewCheckin(
      offender.crn,
      {
        identity: IdentityDecision.MATCH,
        riskManagement: false,
        sensitive: false,
        note: "Ad hoc check in reviewed",
      },
      details,
    );

    await test.step("Nothing is booked afterwards, so the next one can be scheduled", async () => {
      await new ManageCheckInsJourney(page).openManage(offender.crn);
      await expect(manage.settingsFrequency()).toHaveText(
        "I'll schedule them one at a time",
      );
      await expect(manage.settingsNextCheckinDate()).toHaveCount(0);
      await expect(manage.scheduleCheckInButton()).toBeVisible();
    });

    await journey.assertOverviewNextCheckin(
      offender.crn,
      "No online check in scheduled",
    );
  });
});
