import { expect, Page, test } from "@playwright/test";
import {
  login as loginToOasys,
  UserType,
} from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/oasys/login.mjs";
import { createLayer1CompleteAssessment } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/oasys/layer1-assessment/create-layer1-assessment/create-layer1-assessment.mjs";
import { signAndlock } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/oasys/layer1-assessment/sign-and-lock.mjs";
import { OasysDateFormatter } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/date-time.mjs";
import { DateTime } from "luxon";
import { getToken } from "../../../api/auth";
import {
  findSupervisionPackageStatus,
  getOffenderHeader,
} from "../../../api/offender";
import { Person } from "../../../data/delius/types";
import { CreatedDeliusOffender } from "../ndelius/deliusOffenderJourney";
import { OasysAssessment } from "../../../data/models";
import type { ExistingTier } from "../../../data/models";
import { env } from "../../../config/env";
import Layer1AssessmentPage from "../../pages/oasys/layer1AssessmentPage";

// A Layer 1 assessment is many screens long - on top of whatever the calling
// test or hook already had, rather than raising the suite-wide timeout for it.
const LAYER1_EXTRA_TIMEOUT = 6 * 60 * 1000;
const TIER_PROPAGATION_TIMEOUT = 7 * 60 * 1000;
const SUPERVISION_PACKAGE_PROPAGATION_TIMEOUT = 7 * 60 * 1000;
const PROPAGATION_EXTRA_TEST_TIMEOUT = 4 * 60 * 1000;

/**
 * Gives a person a tier through an OASys Layer 1 assessment.
 *  The tier is calculated afterwards; startSetup waits for it.
 */
export default class OasysAssessmentJourney {
  private readonly assessmentPage: Layer1AssessmentPage;

  constructor(private readonly page: Page) {
    this.assessmentPage = new Layer1AssessmentPage(page);
  }

  async assessOffender(
    offender: CreatedDeliusOffender,
    assessment: OasysAssessment,
  ): Promise<void> {
    await this.completeLayer1(
      offender.crn,
      offender.deliusPerson,
      assessment,
      offender.convictionDate,
    );
    await this.waitForCalculatedTier(offender.crn, offender.expectedTier);
  }

  async completeLayer1(
    crn: string,
    person: Person,
    {
      highRosh,
      sexualOffence,
      firstSanctionAge,
      currentOffenceSexuallyMotivated,
      partnerRelationshipNoProblems,
      offenceCode,
      offenceSubCode,
      totalSanctions,
      violentSanctions,
    }: OasysAssessment,
    offenderConvictionDate: Date,
  ): Promise<void> {
    const recentSexualSanctionDate = OasysDateFormatter(
      currentOffenceSexuallyMotivated === false
        ? DateTime.now().minus({ months: 1 }).toJSDate()
        : offenderConvictionDate,
    );
    test.info().setTimeout(test.info().timeout + LAYER1_EXTRA_TIMEOUT);
    await test.step(`Complete OASys Layer 1 for ${crn}`, async () => {
      env.requireOasys();
      await loginToOasys(this.page, UserType.Booking);
      const riskConfirmation = this.assessmentPage.tierRiskConfirmation();
      await this.page.addLocatorHandler(riskConfirmation, async (dialog) => {
        await dialog.getByRole("button", { name: "Yes", exact: true }).click();
      });
      try {
        await createLayer1CompleteAssessment(
          this.page,
          crn,
          person,
          undefined,
          highRosh,
          sexualOffence,
          offenceCode,
          offenceSubCode,
        );
      } finally {
        await this.page.removeLocatorHandler(riskConfirmation);
      }
      const hasPredictorOverrides =
        firstSanctionAge !== undefined ||
        currentOffenceSexuallyMotivated === false ||
        partnerRelationshipNoProblems === true ||
        totalSanctions !== undefined ||
        violentSanctions !== undefined;

      if (hasPredictorOverrides) {
        await this.assessmentPage.predictorsLink().click();
        if (firstSanctionAge !== undefined) {
          await this.assessmentPage
            .firstSanctionAgeField()
            .fill(String(firstSanctionAge));
        }
        if (currentOffenceSexuallyMotivated === false) {
          await this.assessmentPage
            .strangerContactOffence()
            .selectOption("1.44~NO");
          await this.assessmentPage
            .currentOffenceSexualMotivation()
            .selectOption("1.41~NO");
        }
        if (totalSanctions !== undefined) {
          await this.assessmentPage
            .totalSanctionsField()
            .fill(String(totalSanctions));
        }
        if (violentSanctions !== undefined) {
          await this.assessmentPage
            .violentSanctionsField()
            .fill(String(violentSanctions));
        }
        await this.assessmentPage.saveButton().click();
        if (partnerRelationshipNoProblems) {
          await this.assessmentPage.predictorQuestionsLink().click();
          await this.assessmentPage.selectPartnerRelationshipNoProblems();
          await this.assessmentPage.saveButton().click();
          await this.assessmentPage.predictorQuestionsCompleteButton().click();
          await this.assessmentPage.saveButton().click();
        }
        await this.assessmentPage.basicSentencePlanLink().click();
      }

      await this.assessmentPage.predictorsLink().click();
      const convictionDateValue = OasysDateFormatter(offenderConvictionDate);
      await this.assessmentPage.setConvictionDate(convictionDateValue);
      if (sexualOffence || currentOffenceSexuallyMotivated === false) {
        await this.assessmentPage.setMostRecentSexualSanctionDate(
          recentSexualSanctionDate,
        );
      }
      await this.assessmentPage.saveButton().click();

      await this.assessmentPage.selfAssessmentLink().click();
      const selfAssessmentRationale =
        this.assessmentPage.incompleteSelfAssessmentRationale();
      if (await selfAssessmentRationale.isVisible()) {
        await selfAssessmentRationale.fill(
          "Not all self-assessment questions were completed during this test setup.",
        );
        await this.assessmentPage.saveButton().click();
      }
      await this.assessmentPage.markAsCompleteButton().click();
      if (
        (await selfAssessmentRationale.isVisible()) &&
        !(await selfAssessmentRationale.inputValue())
      ) {
        await selfAssessmentRationale.fill(
          "Not all self-assessment questions were completed during this test setup.",
        );
        await this.assessmentPage.saveButton().click();
        await this.assessmentPage.markAsCompleteButton().click();
      }
      await this.assessmentPage.basicSentencePlanLink().click();
      await signAndlock(this.page);
    });
  }

  async waitForCalculatedTier(
    crn: string,
    expectedTier?: ExistingTier,
  ): Promise<void> {
    test
      .info()
      .setTimeout(test.info().timeout + PROPAGATION_EXTRA_TEST_TIMEOUT);
    await test.step(`Wait for ${crn} to receive a calculated Tier`, async () => {
      const token = await getToken();
      await expect
        .poll(
          async () => {
            const header = await getOffenderHeader(crn, token);
            const tier = header.tierScore?.charAt(0).toUpperCase() ?? "";
            return expectedTier ? tier === expectedTier : /^[A-G]$/.test(tier);
          },
          {
            message: expectedTier
              ? `${crn} should receive expected Tier ${expectedTier}`
              : `${crn} should have a calculated Tier`,
            timeout: TIER_PROPAGATION_TIMEOUT,
          },
        )
        .toBe(true);

      await expect
        .poll(() => findSupervisionPackageStatus(crn, token), {
          message: `${crn} should be on a supervision package once it has a Tier`,
          timeout: SUPERVISION_PACKAGE_PROPAGATION_TIMEOUT,
        })
        .toMatchObject({ onSupervisionPackage: true });
    });
  }
}
