import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import { FEELING_ROW_KEY } from "../../../data/models";

export default class ReviewedSubmittedPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Online check in submitted and reviewed");
  }

  identityResultTag(): Locator {
    return this.getQA("reviewSummary").locator(".govuk-tag");
  }

  feelingValue(): Locator {
    return this.summaryValueByKey(FEELING_ROW_KEY);
  }

  assistanceValue(): Locator {
    return this.summaryValueByKey("need support with");
  }

  async addNote(note: string, sensitive = false): Promise<void> {
    await this.fillText("notes", note);
    if ((await this.getQA("sensitiveContact").count()) > 0) {
      await this.clickRadioByName("sensitiveContact", sensitive ? "Yes" : "No");
    }
    await this.clickContinue();
  }
}
