import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export type SummaryField =
  | "date"
  | "frequency"
  | "contactPreference"
  | "mobile"
  | "email"
  | "photo";

const CHANGE_LINK_QA: Record<SummaryField, string> = {
  date: "dateAction",
  frequency: "intervalAction",
  contactPreference: "preferredComsAction",
  mobile: "checkInMobileAction",
  email: "checkInEmailAction",
  photo: "photoUploadOptionAction",
};

const VALUE_ROW_QA: Record<SummaryField, string> = {
  ...CHANGE_LINK_QA,
  photo: "photoAction",
};

export default class CheckInSummaryPage extends MPopBasePage {
  constructor(page: Page, restart = false) {
    super(
      page,
      restart
        ? "Check your answers before restarting online check ins"
        : "Check your answers before adding",
    );
  }

  private summaryRow(actionQa: string): Locator {
    return this.getClass("govuk-summary-list__row").filter({
      has: this.getQA(actionQa),
    });
  }

  summaryValueLocator(field: SummaryField): Locator {
    return this.summaryRow(VALUE_ROW_QA[field]).locator(
      ".govuk-summary-list__value",
    );
  }

  async summaryValue(field: SummaryField): Promise<string> {
    return (await this.summaryValueLocator(field).innerText()).trim();
  }

  async clickChange(field: SummaryField): Promise<void> {
    await this.getQA(CHANGE_LINK_QA[field]).click();
  }

  async submitSetUp(): Promise<void> {
    await this.clickContinue();
  }
}
