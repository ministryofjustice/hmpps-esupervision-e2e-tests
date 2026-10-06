import { Locator, Page } from "@playwright/test";
import { MISSED_REVIEWED_CHECK_IN_TITLE } from "../../../data/manage-online-checkins-ui/pageTitles";
import PractitionerBasePage from "../base/practitionerBasePage";

export interface MissedCheckinUpdate {
  note: string;
  sensitive: boolean;
}

export default class MissedReviewedCheckinPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, MISSED_REVIEWED_CHECK_IN_TITLE);
  }

  reviewSummary(): Locator {
    return this.getQA("reviewSummary");
  }

  sensitiveTag(): Locator {
    return this.getClass("govuk-tag").filter({ hasText: /^\s*Sensitive\s*$/ });
  }

  sensitiveQuestion(): Locator {
    return this.getQA("sensitiveContact");
  }

  async addNote({ note, sensitive }: MissedCheckinUpdate): Promise<void> {
    await this.fillText("notes", note);
    await this.clickRadioByName("sensitiveContact", this.yesNo(sensitive));
    await this.clickContinue();
  }

  async addNoteWithSensitiveHidden(note: string): Promise<void> {
    await this.fillText("notes", note);
    await this.clickContinue();
  }
}
