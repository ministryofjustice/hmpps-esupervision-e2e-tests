import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import { ASSISTANCE_ROW_KEY, FEELING_ROW_KEY } from "../../../data/models";

export interface ReviewResponse {
  note: string;
  riskManagement?: boolean;
  sensitive?: boolean;
}

export default class ReviewResponsesPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Online check in submitted");
  }

  yesNo = (value: boolean): string => (value ? "Yes" : "No");

  feelingValue(): Locator {
    return this.summaryValueByKey(FEELING_ROW_KEY);
  }

  assistanceValue(): Locator {
    return this.summaryValueByKey(ASSISTANCE_ROW_KEY);
  }
  async completePage({
    note,
    riskManagement = false,
    sensitive = false,
  }: ReviewResponse): Promise<void> {
    await this.fillText("notes", note);
    await this.clickRadioByName("riskManagement", this.yesNo(riskManagement));
    await this.clickRadioByName("sensitiveContact", this.yesNo(sensitive));
    await this.clickContinue();
  }
}
