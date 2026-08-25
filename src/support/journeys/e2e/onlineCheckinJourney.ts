import { Page } from "@playwright/test";
import { NewOffender } from "../../../data/delius/types";
import { TEST_CONTACT } from "../../../data/mpop/testData";
import { FrequencyOptions } from "../../pages/mpop/dateFrequencyPage";
import { PhotoOptions } from "../../pages/mpop/photoOptionsPage";
import DeliusOffenderJourney from "../ndelius/deliusOffenderJourney";
import {
  AdditionalAnswer,
  CompletedCheckinDetails,
  CustomQuestion,
  Preference,
  randomAssistanceSelections,
  randomMentalHealthOption,
} from "../../../data/models";
import CheckinJourney from "../checkinJourney";
import { label } from "../../../data/labels";
import ReviewCheckinJourney, {
  Annotation,
  ReviewDecision,
} from "../mpop/reviewCheckinJourney";
import CustomQuestionsJourney from "../mpop/customQuestionsJourney";
import SetupOnlineCheckinsJourney from "../mpop/setupOnlineCheckinsJourney";

export default class OnlineCheckinJourney {
  private readonly customQuestions: CustomQuestionsJourney;
  private readonly review: ReviewCheckinJourney;

  constructor(private readonly page: Page) {
    this.customQuestions = new CustomQuestionsJourney(page);
    this.review = new ReviewCheckinJourney(page);
  }

  async createOffenderAndSetupCheckins(
    firstCheckin: string,
    onOffenderCreated?: (crn: string) => void,
  ): Promise<NewOffender> {
    const offender = await new DeliusOffenderJourney(
      this.page,
    ).createTestOffender();
    // Before setup runs: everything after this point can fail, and the CRN needs to
    // be recoverable by cleanup if it does.
    onOffenderCreated?.(offender.crn);

    const setup = new SetupOnlineCheckinsJourney(this.page);
    await setup.login();
    await setup.startSetup(offender.crn);
    const summary = await setup.completeSetupToSummary(offender.crn, {
      date: firstCheckin,
      frequency: FrequencyOptions.EVERY_WEEK,
      preference: Preference.EMAIL,
      // TODO(legacy-mpop): Drop the mobile when legacy MPOP is removed. MPOP saves
      // both details inline; MOCI can hold both too, but in its setup summary it
      // shows only the preferred contact, so the mobile here is unused on that path.
      contact: { mobile: TEST_CONTACT.mobile, email: TEST_CONTACT.email },
      photo: PhotoOptions.UPLOAD,
      eligibilityIds: [9],
      rationale: "E2E test rationale",
    });
    await setup.submitSetup(summary);
    return offender;
  }

  async completeCheckin(
    uuid: string,
    offender: NewOffender,
    additionalQuestions: string[] = [],
  ): Promise<CompletedCheckinDetails> {
    const mentalHealth = randomMentalHealthOption();
    const assistance = randomAssistanceSelections(2);
    const journey = new CheckinJourney(this.page);
    await journey.navigateToCheckin(uuid);
    await journey.clickStart();
    await journey.completePersonalDetails(offender.person);
    await journey.completeMentalHealthQuestion(mentalHealth);
    await journey.completeAssistanceQuestion(assistance);
    let additional: AdditionalAnswer[] = [];
    if (additionalQuestions.length > 0) {
      additional =
        await journey.completeAdditionalQuestions(additionalQuestions);
    }
    await journey.completeLivenessFlow(uuid);
    await journey.verifyCheckAnswersPage();
    await journey.verifySummaryContains(
      "How have you been feeling since we last spoke?",
      label(mentalHealth),
    );
    await journey.verifyAssistanceCommentsInSummary(assistance);
    await journey.verifyAdditionalAnswersInSummary(additional);
    await journey.submitCheckin();
    await journey.verifyConfirmationPage();
    return { mentalHealth, assistance, additional };
  }

  async assignCustomQuestions(
    crn: string,
    questions: CustomQuestion[],
  ): Promise<void> {
    await this.customQuestions.assignCustomQuestions(crn, questions);
  }

  async assertChangeQuestionsUnavailable(crn: string): Promise<void> {
    await this.customQuestions.assertChangeQuestionsUnavailable(crn);
  }

  async reviewCheckin(
    crn: string,
    decision?: ReviewDecision,
    details?: CompletedCheckinDetails,
  ): Promise<void> {
    await this.review.reviewCompletedCheckin(crn, decision, details);
  }

  async annotateCheckin(crn: string, annotation?: Annotation): Promise<void> {
    await this.review.annotateReviewedCheckin(crn, annotation);
  }
}
