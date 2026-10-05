import { Locator, Page } from "@playwright/test";
import { DiscussionPoint } from "../../../data/models";
import { IS_ELIGIBLE_TITLE } from "../../../data/manage-online-checkins-ui/pageTitles";
import { eligibilityReason } from "./eligibilityReason";
import PractitionerBasePage from "../base/practitionerBasePage";

// One page object for all three variants (Tier D-G, pilot, accredited
// programme): they differ only in the reason text and whether the
// "programmeOnly" discussion box is shown.
export default class IsEligiblePage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, IS_ELIGIBLE_TITLE);
  }

  reason(): Locator {
    return eligibilityReason(this.page);
  }

  reasonBullets(): Locator {
    return this.reason().locator("xpath=following-sibling::ul[1]/li");
  }

  discussionCheckbox(point: DiscussionPoint): Locator {
    return this.page.locator(
      `input[name$="[checkins][discussion]"][value="${point}"]`,
    );
  }

  /** Every discussion point except "I have not done all of these". */
  discussionPoints(): Locator {
    return this.page.locator(
      'input[name$="[checkins][discussion]"]:not([value="notAll"])',
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
