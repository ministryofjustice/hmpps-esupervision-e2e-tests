import { expect, Page } from "@playwright/test";
import { NewOffender } from "../../../data/delius/types";
import { TEST_CONTACT } from "../../../data/manage-online-checkins-ui/testData";
import { FrequencyOptions } from "../../pages/manage-online-checkins-ui/dateFrequencyPage";
import { PhotoOptions } from "../../pages/manage-online-checkins-ui/photoOptionsPage";
import DeliusOffenderJourney, {
  OffenderProfile,
} from "../ndelius/deliusOffenderJourney";
import OasysAssessmentJourney from "../oasys/oasysAssessmentJourney";
import {
  PROFILE_ASSESSMENTS,
  SETUP_ASSESSMENT,
} from "../../../data/delius/testData";
import {
  AdditionalAnswer,
  CompletedCheckinDetails,
  CustomQuestion,
  EligibilityAnswer,
  Preference,
  randomAssistanceSelections,
  randomMentalHealthOption,
} from "../../../data/models";
import CheckinJourney from "../checkins-ui/checkinJourney";
import { label } from "../../../data/labels";
import ReviewCheckinJourney, {
  Annotation,
  MissedAnnotation,
  MissedReviewDecision,
  ReviewDecision,
  SensitiveMissedAnnotation,
} from "../manage-online-checkins-ui/reviewCheckinJourney";
import CustomQuestionsJourney from "../manage-online-checkins-ui/customQuestionsJourney";
import SetupOnlineCheckinsJourney from "../manage-online-checkins-ui/setupOnlineCheckinsJourney";

export default class OnlineCheckinJourney {
  private readonly customQuestions: CustomQuestionsJourney;
  private readonly review: ReviewCheckinJourney;

  constructor(private readonly page: Page) {
    this.customQuestions = new CustomQuestionsJourney(page);
    this.review = new ReviewCheckinJourney(page);
  }

  /**
   * Create a new offender and complete the full online check-in setup flow.
   * Tests the complete end-to-end journey without intermediate assertions.
   */
  async createOffenderAndSetupCheckins(
    firstCheckin: string,
    {
      profile,
      eligibilityAnswers,
      pilotAnswer,
      assertConfirmationLinks = false,
      assertContactRoutes = false,
    }: {
      profile?: OffenderProfile;
      eligibilityAnswers?: EligibilityAnswer[];
      pilotAnswer?: boolean;
      assertConfirmationLinks?: boolean;
      assertContactRoutes?: boolean;
    } = {},
  ): Promise<NewOffender> {
    // Delius records the CRN before assessment, so it remains recoverable if OASys fails.
    const offender = await new DeliusOffenderJourney(
      this.page,
    ).createTestOffender({ profile });
    await new OasysAssessmentJourney(this.page).assessOffender(
      offender,
      profile ? PROFILE_ASSESSMENTS[profile] : SETUP_ASSESSMENT,
    );

    const setup = new SetupOnlineCheckinsJourney(this.page);
    await setup.login();
    await setup.startSetup(offender.crn);
    const summary = await setup.completeSetupToSummary(offender.crn, {
      date: firstCheckin,
      frequency: FrequencyOptions.EVERY_WEEK,
      preference: Preference.EMAIL,
      contact: { email: TEST_CONTACT.email },
      expectedContactRoute: assertContactRoutes ? "missing" : undefined,
      photo: PhotoOptions.UPLOAD,
      eligibilityAnswers,
      pilotAnswer,
    });
    if (assertContactRoutes) {
      await setup.changeContactPreferenceFromSummary(offender.crn, summary, {
        preference: Preference.EMAIL,
        expectedContactRoute: "confirm",
      });
      await expect(summary.summaryValueLocator("email")).toContainText(
        TEST_CONTACT.email,
      );
    }
    await setup.submitSetup(summary);

    // Verify confirmation page links if requested. This must be done before
    // returning, as the confirmation page only exists immediately after submit.
    if (assertConfirmationLinks) {
      await setup.assertConfirmationLinksLandInMpop(offender.crn);
    }

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

  /** `assertMpopHandoff` - see reviewCompletedCheckin for what it turns on. */
  async reviewCheckin(
    crn: string,
    decision?: ReviewDecision,
    details?: CompletedCheckinDetails,
    options?: { assertMpopHandoff?: boolean },
  ): Promise<void> {
    await this.review.reviewCompletedCheckin(crn, decision, details, options);
  }

  async assertReviewedCheckinBackLinkLandsInMpop(crn: string): Promise<void> {
    await this.review.assertReviewedCheckinBackLinkLandsInMpop(crn);
  }

  async annotateCheckin(crn: string, annotation?: Annotation): Promise<void> {
    await this.review.annotateReviewedCheckin(crn, annotation);
  }

  async reviewMissedCheckin(
    crn: string,
    checkinUuid: string,
    decision: MissedReviewDecision,
    expiredAt?: number,
  ): Promise<void> {
    await this.review.reviewMissedCheckin(
      crn,
      checkinUuid,
      decision,
      expiredAt,
    );
  }

  async annotateMissedCheckin(
    crn: string,
    checkinUuid: string,
    annotation: MissedAnnotation,
  ): Promise<void> {
    await this.review.annotateMissedCheckin(crn, checkinUuid, annotation);
  }

  async annotateSensitiveMissedCheckin(
    crn: string,
    checkinUuid: string,
    annotation: SensitiveMissedAnnotation,
  ): Promise<void> {
    await this.review.annotateSensitiveMissedCheckin(
      crn,
      checkinUuid,
      annotation,
    );
  }
}
