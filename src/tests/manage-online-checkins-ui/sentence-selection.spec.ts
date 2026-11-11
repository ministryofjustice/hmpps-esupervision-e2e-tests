import test, { expect, Page } from "@playwright/test";
import { DateTime } from "luxon";
import { env } from "../../config/env";
import { getToken } from "../../api/auth";
import {
  ActiveSentence,
  getActiveSentences,
  getOffenderByCrn,
} from "../../api/offender";
import SetupOnlineCheckinsJourney from "../../support/journeys/manage-online-checkins-ui/setupOnlineCheckinsJourney";
import EligibilityJourney from "../../support/journeys/manage-online-checkins-ui/eligibilityJourney";
import ManageCheckInsJourney from "../../support/journeys/manage-online-checkins-ui/manageCheckinsJourney";
import { ManageCheckinsPages } from "../../support/pages/manage-online-checkins-ui/manageCheckinsPages";
import { FrequencyOptions } from "../../support/pages/manage-online-checkins-ui/checkInFrequencyPage";
import { PhotoOptions } from "../../support/pages/manage-online-checkins-ui/photoOptionsPage";
import { assertManageCheckinsPage } from "../../support/assertions/manage-online-checkins-ui/manageCheckinsAssertions";
import {
  errorTitle,
  SENTENCE_SELECTION_TITLE,
} from "../../data/manage-online-checkins-ui/pageTitles";
import { TEST_CONTACT } from "../../data/manage-online-checkins-ui/testData";
import { Preference } from "../../data/models";
import { firstCheckinDateString } from "../../support/utils/date";

// Reuses TEST_TIER_G_CRN and TEST_MANAGE_CRN, which both need 2+ sentences with
// different end dates. Setup is never submitted, and the manage test puts the
// original sentence back, so both CRNs can still be reused.

const setupCrn = env.tierCrn("G");
const manageCrn = env.manageCrn();

const sentencesFor = async (crn: string): Promise<ActiveSentence[]> => {
  const sentences = await getActiveSentences(crn, await getToken());
  expect(
    sentences.length,
    `${crn} needs 2+ active sentences - is ESUP-2305 on in the API?`,
  ).toBeGreaterThanOrEqual(2);
  return sentences;
};

const openSentenceSelection = async (
  page: Page,
): Promise<ManageCheckinsPages> => {
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(setupCrn);
  await new EligibilityJourney(page).completeToFrequency(setupCrn, {
    route: "setup",
    rationale: "E2E rationale",
    stopAtSentenceSelection: true,
  });
  const moci = new ManageCheckinsPages(page);
  await moci.sentenceSelection.assertOnPage();
  await assertManageCheckinsPage(page, setupCrn, SENTENCE_SELECTION_TITLE);
  return moci;
};

test.describe("Setup wizard - sentence selection", () => {
  let sentences: ActiveSentence[];

  test.beforeAll(async () => {
    sentences = await sentencesFor(setupCrn);
  });

  test("lists each sentence with its end date, latest end date first", async ({
    page,
  }) => {
    const { sentenceSelection } = await openSentenceSelection(page);

    await expect(sentenceSelection.optionLabels()).toHaveText(
      sentences.map((s) => s.description),
    );
    await expect(sentenceSelection.optionHints()).toHaveText(
      sentences.map(
        (s) =>
          `Sentence end date: ${
            s.expectedEndDate
              ? DateTime.fromISO(s.expectedEndDate).toFormat("d MMMM yyyy")
              : "Not available"
          }`,
      ),
    );
    await expect(
      page.getByText(
        "Once the sentence ends, online check ins will be stopped",
      ),
    ).toBeVisible();
  });

  test("shows a validation error when no sentence is selected", async ({
    page,
  }) => {
    const { sentenceSelection } = await openSentenceSelection(page);
    const message = "Select which sentence you want to add online check ins to";

    await sentenceSelection.clickContinue();

    await expect(sentenceSelection.errorSummary()).toContainText(message);
    await expect(sentenceSelection.fieldError(message)).toBeVisible();
    await assertManageCheckinsPage(
      page,
      setupCrn,
      errorTitle(SENTENCE_SELECTION_TITLE),
    );
  });

  test("changes the sentence from check your answers", async ({ page }) => {
    const [latestEnding, earliestEnding] = sentences;
    const moci = new ManageCheckinsPages(page);
    const setup = new SetupOnlineCheckinsJourney(page);
    await setup.login();
    await setup.startSetup(setupCrn);
    // The journey picks the first sentence: the latest end date.
    const summary = await setup.completeSetupToSummary(setupCrn, {
      date: firstCheckinDateString(7),
      frequency: FrequencyOptions.EVERY_WEEK,
      preference: Preference.EMAIL,
      contact: { email: TEST_CONTACT.email },
      photo: PhotoOptions.UPLOAD,
    });
    await expect(summary.summaryValueLocator("sentence")).toContainText(
      latestEnding.description,
    );

    await summary.clickChange("sentence");
    await expect(moci.sentenceSelection.selectedOptionLabel()).toHaveText(
      latestEnding.description,
    );
    await moci.sentenceSelection.completePage(1);

    await summary.assertOnPage();
    await expect(summary.summaryValueLocator("sentence")).toContainText(
      earliestEnding.description,
    );
  });
});

test.describe("Manage - change sentence", () => {
  let sentences: ActiveSentence[];

  test.beforeAll(async () => {
    sentences = await sentencesFor(manageCrn);
  });

  test("changes and saves the linked sentence from the overview", async ({
    page,
  }) => {
    const token = await getToken();
    const moci = new ManageCheckinsPages(page);
    const journey = new ManageCheckInsJourney(page);
    await journey.login();
    const manage = await journey.openManage(manageCrn);

    const linkedEvent = (await getOffenderByCrn(manageCrn, token)).currentEvent;
    const linked = sentences.find((s) => s.eventNumber === linkedEvent);
    expect(linked, `${manageCrn} has no linked sentence`).toBeDefined();
    const other = sentences.find((s) => s !== linked)!;
    const indexOf = (sentence: ActiveSentence) => sentences.indexOf(sentence);

    const changeTo = async (sentence: ActiveSentence) => {
      await manage.changeSentenceLink().click();
      await moci.sentenceSelection.completePage(indexOf(sentence));
      await manage.assertOnPage();
    };

    await expect(manage.sentenceDescription()).toHaveText(linked!.description);

    try {
      await test.step("Cancel leaves the sentence unchanged", async () => {
        await manage.changeSentenceLink().click();
        await expect(moci.sentenceSelection.selectedOptionLabel()).toHaveText(
          linked!.description,
        );
        await moci.sentenceSelection.cancelLink().click();
        await manage.assertOnPage();
        await expect(manage.sentenceDescription()).toHaveText(
          linked!.description,
        );
      });

      await test.step("Save a different sentence", async () => {
        await changeTo(other);
        await expect(manage.successBanner()).toBeVisible();
        await expect(manage.sentenceDescription()).toHaveText(
          other.description,
        );
        expect((await getOffenderByCrn(manageCrn, token)).currentEvent).toBe(
          other.eventNumber,
        );
      });
    } finally {
      // Put the original sentence back so the CRN can be reused.
      if (
        (await getOffenderByCrn(manageCrn, token)).currentEvent !==
        linked!.eventNumber
      ) {
        await changeTo(linked!);
      }
    }
  });
});
