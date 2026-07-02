import { Page } from "@playwright/test";
import { NewOffender } from "../../../data/delius/types";
import { TEST_CONTACT } from "../../../data/mpop/testData";
import { Preference } from "../../pages/mpop/contactPreferencePage";
import { FrequencyOptions } from "../../pages/mpop/dateFrequencyPage";
import { PhotoOptions } from "../../pages/mpop/photoOptionsPage";
import SetupOnlineCheckinsJourney from "../mpop/setupOnlineCheckinsJourney";
import DeliusOffenderJourney from "../ndelius/deliusOffenderJourney";
import {
  CompletedCheckinDetails,
  randomAssistanceSelections,
  randomMentalHealthOption,
} from "../../../data/models";
import CheckinJourney from "../checkinJourney";
import { label } from "../../../data/labels";
import ReviewCheckinJourney, {
  Annotation,
  ReviewDecision,
} from "../mpop/reviewCheckinJourney";

export default class OnlineCheckinJourney {
  constructor(private readonly page: Page) {}

  async createOffenderAndSetupCheckins(
    firstCheckin: string,
  ): Promise<NewOffender> {
    const offender = await new DeliusOffenderJourney(
      this.page,
    ).createTestOffender();
    const setup = new SetupOnlineCheckinsJourney(this.page);
    await setup.login();
    await setup.startSetup(offender.crn);
    const summary = await setup.completeSetupToSummary({
      date: firstCheckin,
      frequency: FrequencyOptions.EVERY_WEEK,
      preference: Preference.EMAIL,
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
  ): Promise<CompletedCheckinDetails> {
    const mentalHealth = randomMentalHealthOption();
    const assistance = randomAssistanceSelections(2);
    const journey = new CheckinJourney(this.page);
    await journey.navigateToCheckin(uuid);
    await journey.clickStart();
    await journey.completePersonalDetails(offender.person);
    await journey.completeMentalHealthQuestion(mentalHealth);
    await journey.completeAssistanceQuestion(assistance);
    await journey.completeLivenessFlow(uuid);
    await journey.verifyCheckAnswersPage();
    await journey.verifySummaryContains(
      "How have you been feeling since we last spoke?",
      label(mentalHealth),
    );
    await journey.verifyAssistanceCommentsInSummary(assistance);
    await journey.submitCheckin();
    await journey.verifyConfirmationPage();
    return { mentalHealth, assistance };
  }

  async reviewCheckin(
    crn: string,
    decision?: ReviewDecision,
    details?: CompletedCheckinDetails,
  ): Promise<void> {
    await new ReviewCheckinJourney(this.page).reviewCompletedCheckin(
      crn,
      decision,
      details,
    );
  }

  async annotateCheckin(crn: string, annotation?: Annotation): Promise<void> {
    await new ReviewCheckinJourney(this.page).annotateReviewedCheckin(
      crn,
      annotation,
    );
  }
}
