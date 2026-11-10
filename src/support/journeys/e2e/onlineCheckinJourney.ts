import { expect, Page, test } from "@playwright/test";
import { getToken as getIntegrationToken } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/api/auth/get-token.mjs";
import {
  createAndBookPrisoner,
  releasePrisoner,
  updateCustodyDates,
} from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/api/dps/prison-api.mjs";
import { login as loginToDelius } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/login.mjs";
import { createRelease } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/release/create-release.mjs";
import { assertOk, authHeader } from "../../../api/apiHelper";
import { getToken } from "../../../api/auth";
import { findSupervisionPackageStatus } from "../../../api/offender";
import { env } from "../../../config/env";
import { NewOffender } from "../../../data/delius/types";
import OverviewPage from "../../pages/mpop/overviewPage";
import { TEST_CONTACT } from "../../../data/manage-online-checkins-ui/testData";
import { FrequencyOptions } from "../../pages/manage-online-checkins-ui/checkInFrequencyPage";
import { PhotoOptions } from "../../pages/manage-online-checkins-ui/photoOptionsPage";
import DeliusOffenderJourney, {
  CreatedDeliusOffender,
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
  EligibilityAnswer,
  Preference,
  QuestionToAdd,
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
} from "../manage-online-checkins-ui/reviewCheckinJourney";
import CustomQuestionsJourney from "../manage-online-checkins-ui/customQuestionsJourney";
import SetupOnlineCheckinsJourney from "../manage-online-checkins-ui/setupOnlineCheckinsJourney";
import { finalThirdDates } from "../../utils/finalThirdDates";

export default class OnlineCheckinJourney {
  private readonly customQuestions: CustomQuestionsJourney;
  private readonly review: ReviewCheckinJourney;

  constructor(private readonly page: Page) {
    this.customQuestions = new CustomQuestionsJourney(page);
    this.review = new ReviewCheckinJourney(page);
  }

  /** Create a final-third case for eligibility tests, without setting up check ins. */
  async createOffenderInFinalThird(): Promise<CreatedDeliusOffender> {
    test.info().setTimeout(test.info().timeout + 25 * 60 * 1000);
    return test.step("Create a CRN currently in its final third", async () => {
      const required = [
        "DELIUS_URL",
        "DELIUS_USERNAME",
        "DELIUS_PASSWORD",
        "OASYS_URL",
        "OASYS_USERNAME",
        "OASYS_PASSWORD",
        "AUTH_URL",
        "AUTH_CLIENT_ID",
        "AUTH_CLIENT_SECRET",
        "ESUPERVISION_API_URL",
        "PRISON_API",
        "DPS_USERNAME",
        "HMPPS_AUTH_CLIENT_ID",
        "HMPPS_AUTH_CLIENT_SECRET",
        "CUSTODY_KEY_DATES_API_URL",
        "SUPERVISION_PACKAGES_API_URL",
      ];
      const missing = required.filter((name) => !process.env[name]?.trim());
      expect(
        missing,
        "Set the required final-third setup environment variables",
      ).toEqual([]);
      for (const [name, origin] of Object.entries({
        DELIUS_URL: "https://ndelius.test.probation.service.justice.gov.uk",
        OASYS_URL: "https://t2.oasys.service.justice.gov.uk",
        AUTH_URL: "https://sign-in-dev.hmpps.service.justice.gov.uk",
        ESUPERVISION_API_URL:
          "https://esupervision-api-dev.hmpps.service.justice.gov.uk",
        PRISON_API: "https://prison-api-dev.prison.service.justice.gov.uk",
        CUSTODY_KEY_DATES_API_URL:
          "https://custody-key-dates-and-delius-dev.hmpps.service.justice.gov.uk",
        SUPERVISION_PACKAGES_API_URL:
          "https://supervision-packages-api-dev.hmpps.service.justice.gov.uk",
      })) {
        expect(
          new URL(process.env[name]!).origin,
          `${name} must target dev/test`,
        ).toBe(origin);
      }
      env.requireOasys();
      const integrationToken = await getIntegrationToken();
      expect(
        integrationToken,
        "Integration client must obtain an access token",
      ).toEqual(expect.any(String));
      expect(integrationToken).not.toBe("");
      const token = await getToken();
      const dates = finalThirdDates();
      const offender = await new DeliusOffenderJourney(
        this.page,
      ).createTestOffender({
        profile: "custodialAge25",
        convictionDate: dates.sentenceDate.toJSDate(),
      });
      console.log(`Created final-third candidate CRN: ${offender.crn}`);

      const { nomisId, bookingId } = await createAndBookPrisoner(
        this.page,
        offender.crn,
        offender.deliusPerson,
      );
      expect(
        nomisId,
        "A single valid NOMIS ID is required for the refresh",
      ).toMatch(/^[A-Z]\d{4}[A-Z]{2}$/);
      try {
        await test.info().attach("final-third-custody", {
          body: JSON.stringify({ crn: offender.crn, nomisId, bookingId }),
          contentType: "application/json",
        });
        await updateCustodyDates(bookingId, {
          sentenceExpiryDate: dates.expiryDate.toISODate(),
          licenceExpiryDate: dates.expiryDate.toISODate(),
          conditionalReleaseDate: dates.releaseDate.toISODate(),
        });
        await loginToDelius(this.page);
        await createRelease(
          this.page,
          offender.crn,
          1,
          false,
          dates.releaseDate.toJSDate(),
        );
        const response = await this.page.request.post(
          `${process.env.CUSTODY_KEY_DATES_API_URL}/update-custody-dates?dryRun=false`,
          {
            headers: authHeader(integrationToken),
            // Never omit this list: the endpoint can otherwise request a bulk update.
            data: [nomisId],
          },
        );
        await assertOk(
          response,
          "Request derived custody dates for the new CRN",
        );
      } finally {
        await releasePrisoner(nomisId);
      }

      await new OasysAssessmentJourney(this.page).assessOffender(
        offender,
        SETUP_ASSESSMENT,
      );

      await expect
        .poll(
          async () => {
            const response = await this.page.request.get(
              `${process.env.SUPERVISION_PACKAGES_API_URL}/frontend-context/${offender.crn}`,
              { headers: authHeader(integrationToken) },
            );
            await assertOk(response, "Get the new CRN's supervision phase");
            return {
              frontend: await response.json(),
              esupervision: await findSupervisionPackageStatus(
                offender.crn,
                token,
              ),
            };
          },
          {
            timeout: 7 * 60 * 1000,
            intervals: [5000, 10000],
            message:
              "The CRN must reach FTHRD, not merely be eligible. Check its FTHRD " +
              "Throughcare date, the calculate-key-dates-from-delius flag, tier, " +
              "release, and any FTHNA/NSD/ISC exclusions if this times out.",
          },
        )
        .toMatchObject({
          frontend: {
            currentPhase: { phase: { code: "FTHRD" } },
            context: { finalThirdEligibility: { eligible: true } },
          },
          esupervision: { onSupervisionPackage: true, inFinalThird: true },
        });

      return offender;
    });
  }

  /**
   * Create a new offender and complete the full online check-in setup flow.
   * Tests the complete end-to-end journey without intermediate assertions.
   */
  async createOffenderAndSetupCheckins(
    firstCheckin: string | undefined,
    {
      profile,
      eligibilityAnswers,
      pilotAnswer,
      assertConfirmationLinks = false,
      assertContactRoutes = false,
      frequency = FrequencyOptions.EVERY_WEEK,
    }: {
      profile?: OffenderProfile;
      eligibilityAnswers?: EligibilityAnswer[];
      pilotAnswer?: boolean;
      assertConfirmationLinks?: boolean;
      assertContactRoutes?: boolean;
      frequency?: FrequencyOptions;
    } = {},
  ): Promise<NewOffender> {
    if (frequency !== FrequencyOptions.AD_HOC && !firstCheckin?.trim()) {
      throw new Error(
        "A first check in date is required for recurring check ins",
      );
    }

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
      frequency,
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
    questions: QuestionToAdd[],
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
  ): Promise<void> {
    await this.review.reviewMissedCheckin(crn, checkinUuid, decision);
  }

  async annotateMissedCheckin(
    crn: string,
    checkinUuid: string,
    annotation: MissedAnnotation,
  ): Promise<void> {
    await this.review.annotateMissedCheckin(crn, checkinUuid, annotation);
  }

  async assertOverviewNextCheckin(
    crn: string,
    expectedDate: string | RegExp,
  ): Promise<void> {
    await test.step("MPOP overview shows the next online check in date", async () => {
      const overview = new OverviewPage(this.page);
      await overview.goTo(crn);
      await overview.assertOnPage();
      await expect(overview.nextCheckinValue()).toHaveText(expectedDate);
    });
  }
}
