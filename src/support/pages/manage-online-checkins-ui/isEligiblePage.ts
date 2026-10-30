import { expect, Locator, Page } from "@playwright/test";
import { DiscussionPoint } from "../../../data/models";
import {
  ACCREDITED_PROGRAMME_IS_ELIGIBLE_TITLE,
  IS_ELIGIBLE_TITLE,
} from "../../../data/manage-online-checkins-ui/pageTitles";
import { escapeRegExp } from "../../utils/url";
import { eligibilityReason } from "./eligibilityReason";
import PractitionerBasePage from "../base/practitionerBasePage";

export type IsEligibleVariant = "standard" | "accreditedProgramme";

const headingSuffix = (title: string): string =>
  escapeRegExp(title.replace(/^The person/, ""));

const STANDARD_SUFFIX = headingSuffix(IS_ELIGIBLE_TITLE);
const ACCREDITED_SUFFIX = headingSuffix(ACCREDITED_PROGRAMME_IS_ELIGIBLE_TITLE);

const eligibleHeading = (suffix: string): RegExp =>
  new RegExp(`^\\s*(?!Check if\\b)\\S.*?${suffix}\\s*$`);

const VARIANT_HEADINGS: Record<IsEligibleVariant, RegExp> = {
  standard: eligibleHeading(STANDARD_SUFFIX),
  accreditedProgramme: eligibleHeading(ACCREDITED_SUFFIX),
};

const ANY_ELIGIBLE_HEADING = eligibleHeading(
  `(?:${ACCREDITED_SUFFIX}|${STANDARD_SUFFIX})`,
);

export default class IsEligiblePage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, ANY_ELIGIBLE_HEADING);
  }

  async assertOnVariant(
    variant: IsEligibleVariant,
    timeout = 10000,
  ): Promise<void> {
    await expect(this.getQA("pageHeading")).toContainText(
      VARIANT_HEADINGS[variant],
      { timeout },
    );
  }

  reason(): Locator {
    return eligibilityReason(this.page);
  }

  reasonBullets(): Locator {
    return this.reason().locator("xpath=following-sibling::ul[1]/li");
  }

  discussionCheckbox(point: DiscussionPoint): Locator {
    return this.page.locator(`input[name$="[discussion]"][value="${point}"]`);
  }

  /** Every discussion point except "I have not done all of these". */
  discussionPoints(): Locator {
    return this.page.locator(
      'input[name$="[discussion]"]:not([value="notAll"])',
    );
  }

  async completePage(): Promise<void> {
    for (const point of await this.discussionPoints().all()) {
      await point.check();
    }
    await this.clickContinue();
  }

  async completePartially(points: DiscussionPoint[]): Promise<void> {
    for (const point of points) {
      await this.discussionCheckbox(point).check();
    }
    await this.clickContinue();
  }
}
