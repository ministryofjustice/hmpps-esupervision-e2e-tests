import { expect, type Locator, type Page } from "@playwright/test";
import BasePage from "./basePage";
import { type YearMonth } from "../../utils/dashboard/yearMonth";
import {
  QUERY_MONTH_FROM,
  QUERY_MONTH_TO,
  SELECT_MONTH_FROM_ID,
  SELECT_MONTH_TO_ID,
} from "../../../data/dashboard/filters";

export default abstract class DashboardBasePage extends BasePage {
  protected readonly heading: string | RegExp;

  constructor(page: Page, heading: string | RegExp) {
    super(page);
    this.heading = heading;
  }

  pageHeading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  async assertOnPage(): Promise<void> {
    await expect(this.pageHeading()).toContainText(this.heading);
  }

  lastUpdated(): Locator {
    return this.page.locator("p", {
      hasText: /This data was last updated on/,
    });
  }

  async snapshotTime(): Promise<string> {
    return (await this.lastUpdated().innerText()).replace(/\s+/g, " ").trim();
  }

  errorSummary(): Locator {
    return this.page.locator(".govuk-error-summary");
  }

  private monthFromSelect(): Locator {
    return this.getByID(SELECT_MONTH_FROM_ID);
  }

  private monthToSelect(): Locator {
    return this.getByID(SELECT_MONTH_TO_ID);
  }

  private applyFiltersButton(): Locator {
    return this.page.getByRole("button", { name: "Apply filters" });
  }

  resetFiltersLink(): Locator {
    return this.page.getByRole("button", { name: "Reset filters" });
  }

  async selectMonthRange(from: YearMonth, to: YearMonth): Promise<void> {
    await this.monthFromSelect().selectOption(from);
    await this.monthToSelect().selectOption(to);
  }

  async applyFilters(from: YearMonth, to: YearMonth): Promise<void> {
    const navigated = this.page.waitForResponse(
      (response) =>
        response.request().isNavigationRequest() &&
        response.request().frame() === this.page.mainFrame(),
    );
    await this.applyFiltersButton().click();
    await navigated;
    await this.page.waitForURL(
      (url) =>
        url.searchParams.get(QUERY_MONTH_FROM) === from &&
        url.searchParams.get(QUERY_MONTH_TO) === to,
    );
  }

  async assertSelectedRange(from: YearMonth, to: YearMonth): Promise<void> {
    await expect(this.monthFromSelect()).toHaveValue(from);
    await expect(this.monthToSelect()).toHaveValue(to);
  }
}
