import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export interface ReviewNotes {
  note: string;
  riskManagement?: boolean;
  sensitive?: boolean;
}

export default class ReviewNotesPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Online check in submitted");
  }

  async completePage({
    note,
    riskManagement = false,
    sensitive = false,
  }: ReviewNotes): Promise<void> {
    await this.fillText("notes", note);
    await this.clickRadioByName("riskManagement", this.yesNo(riskManagement));
    await this.clickRadioByName("sensitiveContact", this.yesNo(sensitive));
    await this.clickContinue();
  }
}
