import { expect, Locator, Page } from "@playwright/test";
import BasePage from "./basePage";
import { YearMonth } from "../../utils/month";

/**
 * Shared by both tabs of the data dashboard: the heading, the last updated line
 * and the From/To month filter.
 */
export default abstract class DashboardBasePage extends BasePage {
  protected readonly heading: string | RegExp;

  constructor(page: Page, heading: string | RegExp) {
    super(page);
    this.heading = heading;
  }

  async isOnPage(): Promise<void> {
    await expect(this.page.getByRole("heading", { level: 1 })).toContainText(
      this.heading,
    );
  }

  pageHeading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  lastUpdated(): Locator {
    return this.page.locator("p", {
      hasText: /This data was last updated on/,
    });
  }

  monthFromSelect(): Locator {
    return this.getByID("monthFrom");
  }

  monthToSelect(): Locator {
    return this.getByID("monthTo");
  }

  applyFiltersButton(): Locator {
    return this.page.getByRole("button", { name: "Apply filters" });
  }

  async selectMonthRange(from: YearMonth, to: YearMonth): Promise<void> {
    await this.monthFromSelect().selectOption(from);
    await this.monthToSelect().selectOption(to);
  }

  async applyFilters(): Promise<void> {
    await this.applyFiltersButton().click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async assertSelectedRange(from: YearMonth, to: YearMonth): Promise<void> {
    await expect(this.monthFromSelect()).toHaveValue(from);
    await expect(this.monthToSelect()).toHaveValue(to);
  }

  /**
   * A table rendered by govukTable, matched on its <caption> element. Filtering
   * on the caption rather than on any descendant text matters: several captions
   * also occur inside row labels, and a looser filter would match more than one
   * table and raise a strict mode violation instead of a clear failure.
   */
  protected tableByCaption(caption: string): Locator {
    return this.page.locator("table.govuk-table").filter({
      has: this.page.locator("caption", {
        hasText: new RegExp(`^\\s*${caption}\\s*$`),
      }),
    });
  }
}
