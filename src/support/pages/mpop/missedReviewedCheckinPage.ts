import { Locator, Page } from "@playwright/test";
import { MISSED_REVIEWED_CHECK_IN_TITLE } from "../../../data/manage-checkins-ui/pageTitles";
import MPopBasePage from "../base/mpopBasePage";

export interface MissedCheckinUpdate {
  note: string;
  /** Answer to the sensitive information question. Always given, no default. */
  sensitive: boolean;
}

/** A missed check in after its review has been filed. */
export default class MissedReviewedCheckinPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, MISSED_REVIEWED_CHECK_IN_TITLE);
  }

  /** The reason and any notes added since. */
  reviewSummary(): Locator {
    return this.getQA("reviewSummary");
  }

  // The tag has no data-qa, so match on its text. Anchored so a longer tag
  // can't match by accident.
  sensitiveTag(): Locator {
    return this.getClass("govuk-tag").filter({ hasText: /^\s*Sensitive\s*$/ });
  }

  /** Only asked while the check in isn't sensitive yet. */
  sensitiveQuestion(): Locator {
    return this.getQA("sensitiveContact");
  }

  async addNote({ note, sensitive }: MissedCheckinUpdate): Promise<void> {
    await this.fillText("notes", note);
    await this.clickRadioByName("sensitiveContact", this.yesNo(sensitive));
    await this.clickContinue();
  }

  /** Once the check in is sensitive the page stops asking - it hides the
   *  question and submits the answer itself. */
  async addNoteWithSensitiveHidden(note: string): Promise<void> {
    await this.fillText("notes", note);
    await this.clickContinue();
  }
}
