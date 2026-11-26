import { expect, Page, test } from "@playwright/test";
import { ManageCheckinsPages } from "../../pages/manage-online-checkins-ui/manageCheckinsPages";
import { EligibilityAnswer } from "../../../data/models";
import {
  ACCREDITED_PROGRAMME_IS_ELIGIBLE_TITLE,
  IS_ELIGIBLE_TITLE,
  NOT_ELIGIBLE_TITLE,
} from "../../../data/manage-online-checkins-ui/pageTitles";
import { assertManageCheckinsPage } from "../../assertions/manage-online-checkins-ui/manageCheckinsAssertions";
import { getToken } from "../../../api/auth";
import {
  ACCREDITED_PROGRAMME_RULE,
  checkEligibility,
  toEligibilityAnswers,
} from "../../../api/eligibility";
import { env } from "../../../config/env";
export type EligibilityRoute = "setup" | "restart";

export interface EligibilityOptions {
  route: EligibilityRoute;
  answers?: EligibilityAnswer[];
  /** Only used while useEligibilityEndpoint is off: the pilot question has gone with it on. */
  pilotAnswer?: boolean;
  /** Only used on the accredited programme route. */
  rationale: string;
  /** Only used when the person has 2+ sentences. */
  stopAtSentenceSelection?: boolean;
}

const ELIGIBILITY_OUTCOME_TIMEOUT = 20000;

/** The eligibility pages shared by setup and restart. */
export default class EligibilityJourney {
  private readonly pages: ManageCheckinsPages;

  constructor(private readonly page: Page) {
    this.pages = new ManageCheckinsPages(page);
  }

  async completeToFrequency(
    crn: string,
    opts: EligibilityOptions,
  ): Promise<{ accreditedProgramme: boolean }> {
    const moci = this.pages;
    let answers = opts.answers ?? ["none"];
    const pilotAnswer = opts.pilotAnswer ?? true;
    const when = opts.route === "setup" ? "setting up" : "restarting";
    if (env.eligibilityEndpoint()) {
      await assertEligibilityEndpointJourney(this.page);
    }

    for (const answer of answers) {
      if (!(await moci.eligibilityCheck.answerCheckbox(answer).isVisible())) {
        const tierHint =
          answer === "accreditedProgramme" || answer === "youthSentence"
            ? " It is only shown for Tier A/B cases."
            : "";
        throw new Error(
          `CRN ${crn} cannot answer "${answer}" when ${when} check ins: the option is not shown on the eligibility check page.${tierHint}`,
        );
      }
    }
    // With useEligibilityEndpoint on the ESUP API decides, so ask it first: a CRN whose data has
    // changed then fails with the API's reason, and the route is the one the API took.
    let accreditedProgramme = answers.includes("accreditedProgramme");
    if (env.eligibilityEndpoint()) {
      const tierAB = await moci.eligibilityCheck
        .answerCheckbox("accreditedProgramme")
        .isVisible();
      const token = await getToken();
      let check = await checkEligibility(
        crn,
        toEligibilityAnswers(answers, tierAB),
        token,
      );
      // Off an accredited programme, Tier A/B is only eligible for a practitioner who has had a
      // pilot case. When the test left the answers to the journey, take the programme route.
      if (
        !opts.answers &&
        tierAB &&
        check.outcome === "INELIGIBLE" &&
        check.ruleCode === "ON_ACCREDITED_PROGRAMME"
      ) {
        answers = ["accreditedProgramme"];
        test.info().annotations.push({
          type: "eligibility",
          description: `${crn} is Tier A/B and the e2e practitioner has no pilot case, so ${when} took the accredited programme route`,
        });
        check = await checkEligibility(
          crn,
          toEligibilityAnswers(answers, tierAB),
          token,
        );
      }
      if (check.outcome !== "ELIGIBLE") {
        throw new Error(
          `CRN ${crn} is ${check.outcome} for the ESUP API when ${when} check ins (${check.ruleCode}): ${check.message}`,
        );
      }
      accreditedProgramme = check.ruleCode === ACCREDITED_PROGRAMME_RULE;
    }
    await moci.eligibilityCheck.completePage(answers);

    const notEligible = moci.notEligible.headingLocator();
    const pilotYes = moci.pilotCheck.yesRadio();
    const eligibleDiscussion = moci.isEligible.discussionCheckbox("optional");
    await expect(
      notEligible.or(pilotYes).or(eligibleDiscussion),
      "Submitting the eligibility check should lead to not eligible, the pilot question or is eligible",
    ).toBeVisible({ timeout: ELIGIBILITY_OUTCOME_TIMEOUT });

    if (await notEligible.isVisible()) {
      await assertManageCheckinsPage(this.page, crn, NOT_ELIGIBLE_TITLE);
      throw new Error(
        `CRN ${crn} was ruled not eligible when ${when} check ins - check the CRN meets the eligibility rules`,
      );
    }

    if (await pilotYes.isVisible()) {
      if (env.eligibilityEndpoint()) {
        throw new Error(
          `CRN ${crn} was asked the pilot question, which useEligibilityEndpoint removes - is the flag off? Set ELIGIBILITY_ENDPOINT=off to test that journey`,
        );
      }
      await moci.pilotCheck.answer(pilotAnswer);
      if (!pilotAnswer) {
        await assertManageCheckinsPage(this.page, crn, NOT_ELIGIBLE_TITLE);
        throw new Error(
          `CRN ${crn} was ruled not eligible because the pilot answer was No`,
        );
      }
    }

    await assertManageCheckinsPage(
      this.page,
      crn,
      accreditedProgramme
        ? ACCREDITED_PROGRAMME_IS_ELIGIBLE_TITLE
        : IS_ELIGIBLE_TITLE,
    );
    await moci.isEligible.assertOnVariant(
      accreditedProgramme ? "accreditedProgramme" : "standard",
    );
    await moci.isEligible.completePage();

    if (accreditedProgramme) {
      await moci.accreditedProgrammeApproval.assertOnPage();
      await moci.accreditedProgrammeApproval.completePage();
      await moci.rationale.assertOnPage();
      await moci.rationale.completePage(opts.rationale);
    }
    // Only shown when the person has 2+ sentences. Keeps a sentence that is already
    // selected (restart selects the previous one), otherwise picks the first.
    const sentenceSelection = moci.sentenceSelection.headingLocator();
    await expect(
      sentenceSelection.or(moci.checkinFrequency.headingLocator()),
    ).toBeVisible();
    if (await sentenceSelection.isVisible()) {
      if (opts.stopAtSentenceSelection) return { accreditedProgramme };
      if (await moci.sentenceSelection.selectedOptionLabel().count()) {
        await moci.sentenceSelection.clickContinue();
      } else {
        await moci.sentenceSelection.completePage();
      }
    }
    return { accreditedProgramme };
  }
}

/**
 * Fails fast, with what to do about it, when the environment's flag doesn't match
 * ELIGIBILITY_ENDPOINT: the eligibility check page only asks about recall while the flag is off.
 */
export const assertEligibilityEndpointJourney = async (
  page: Page,
): Promise<void> => {
  const moci = new ManageCheckinsPages(page);
  await moci.eligibilityCheck.assertOnPage();
  await expect(
    moci.eligibilityCheck.answerCheckbox("recalled"),
    "The eligibility check asks about recall, so MOCI's useEligibilityEndpoint flag looks off - set ELIGIBILITY_ENDPOINT=off to test that journey",
  ).toHaveCount(env.eligibilityEndpoint() ? 0 : 1);
};
