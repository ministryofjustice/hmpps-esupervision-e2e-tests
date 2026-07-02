import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import { FEELING_ROW_KEY, ASSISTANCE_ROW_KEY } from "../../../data/models";

export default class ReviewedSubmittedPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Online check in submitted and reviewed");
  }

  reviewSummary(): Locator {
    return this.getQA("reviewSummary");
  }

  identityResultTag(): Locator {
    return this.getQA("reviewSummary").locator(".govuk-tag");
  }

  feelingValue(): Locator {
    return this.summaryValueByKey(FEELING_ROW_KEY);
  }

  assistanceValue(): Locator {
    return this.summaryValueByKey(ASSISTANCE_ROW_KEY);
  }

  referenceImage(): Locator {
    return this.getQA("checkInSummary").getByAltText(/^Profile image of/);
  }

  checkinImageRow(): Locator {
    return this.getQA("checkInSummary")
      .locator(".govuk-summary-list__row")
      .filter({ hasText: "Image from check in" });
  }

  async addNote(note: string, sensitive = false): Promise<void> {
    await this.fillText("notes", note);
    if ((await this.getQA("sensitiveContact").count()) > 0) {
      await this.clickRadioByName("sensitiveContact", sensitive ? "Yes" : "No");
    }
    await this.clickContinue();
  }
}
