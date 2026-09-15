import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import { MissedCheckinReview } from "../../../data/models";
import { MISSED_CHECK_IN_TITLE } from "../../../data/manage-checkins-ui/pageTitles";

// Anchored so it doesn't also match the reviewed page's heading, which starts
// with the same text.
const MISSED_HEADING = new RegExp(`^\\s*${MISSED_CHECK_IN_TITLE}\\s*$`);

// Longer than the plain Yes/No the submitted review uses.
const SENSITIVE_LABELS = {
  yes: "Yes, it includes sensitive information",
  no: "No, it is not sensitive",
};

/** The review page for a check in the person never submitted. */
export default class MissedCheckinPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, MISSED_HEADING);
  }

  async completePage({
    note,
    sensitive = false,
  }: MissedCheckinReview): Promise<void> {
    await this.fillText("notes", note);
    await this.clickRadioByName(
      "sensitiveContact",
      sensitive ? SENSITIVE_LABELS.yes : SENSITIVE_LABELS.no,
    );
    await this.clickContinue();
  }
}
