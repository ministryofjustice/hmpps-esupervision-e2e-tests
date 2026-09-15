import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import { REVIEWED_MISSED_CHECK_IN_TITLE } from "../../../data/manage-checkins-ui/pageTitles";

/** A missed check in that has already been reviewed. */
export default class ReviewedMissedCheckinPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, REVIEWED_MISSED_CHECK_IN_TITLE);
  }

  reviewSummary(): Locator {
    return this.getQA("reviewSummary");
  }

  /** Shown next to the heading, only when the review marked it sensitive. */
  sensitiveTag(): Locator {
    return this.getClass("govuk-tag--yellow").filter({
      hasText: /^\s*Sensitive\s*$/,
    });
  }
}
