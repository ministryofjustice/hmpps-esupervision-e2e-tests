import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class ReviewedCheckinPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Online check in submitted and reviewed");
  }

  reviewSummary(): Locator {
    return this.getQA("reviewSummary");
  }

  identityResultTag(): Locator {
    return this.getQA("reviewSummary").locator(".govuk-tag");
  }

  private checkinSummary(): Locator {
    return this.getQA("checkInSummary");
  }

  referenceImage(): Locator {
    return this.checkinSummary().getByAltText(/^Profile image of/);
  }

  checkinImageRow(): Locator {
    return this.checkinSummary()
      .locator(".govuk-summary-list__row")
      .filter({ hasText: "Image from check in" });
  }

  async addNote(note: string, sensitive = false): Promise<void> {
    await this.fillText("notes", note);
    if ((await this.getQA("sensitiveContact").count()) > 0) {
      await this.clickRadioByName("sensitiveContact", this.yesNo(sensitive));
    }
    await this.clickContinue();
  }
}
