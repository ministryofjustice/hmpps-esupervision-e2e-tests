import { expect, Page } from "@playwright/test";
import { ManageCheckinsPages } from "../../pages/manage-online-checkins-ui/manageCheckinsPages";
import { EligibilityAnswer } from "../../../data/models";
import {
  ACCREDITED_PROGRAMME_IS_ELIGIBLE_TITLE,
  IS_ELIGIBLE_TITLE,
  NOT_ELIGIBLE_TITLE,
} from "../../../data/manage-online-checkins-ui/pageTitles";
import { assertManageCheckinsPage } from "../../assertions/manage-online-checkins-ui/manageCheckinsAssertions";

export type EligibilityRoute = "setup" | "restart";

export interface EligibilityOptions {
  route: EligibilityRoute;
  answers?: EligibilityAnswer[];
  pilotAnswer?: boolean;
  /** Only used on the accredited programme route. */
  rationale: string;
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
  ): Promise<void> {
    const moci = this.pages;
    const answers = opts.answers ?? ["none"];
    const pilotAnswer = opts.pilotAnswer ?? true;
    const accreditedProgramme = answers.includes("accreditedProgramme");
    const when = opts.route === "setup" ? "setting up" : "restarting";

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
    await moci.checkinFrequency.assertOnPage();
  }
}
