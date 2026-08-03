import { expect, Page, test } from "@playwright/test";
import { env } from "../../../config/env";
import { DashboardPages } from "../../pages/dashboard/dashboardPages";
import {
  DATA_DASHBOARD_PATH,
  REGION_DASHBOARD_PATH,
} from "../../../data/dashboard/dataDashboardConstants";
import { YearMonth } from "../../utils/month";

export default class DashboardJourney {
  private readonly pages: DashboardPages;

  constructor(private readonly page: Page) {
    this.pages = new DashboardPages(page);
  }

  /**
   * The dashboard sits behind HMPPS Auth. Navigating to the protected path first
   * exercises the `returnTo` redirect, so signing in this way also proves a user
   * lands where they asked to go.
   */
  private origin(): string {
    return new URL(env.dashboardUrl()).origin;
  }

  async signIn(path: string = DATA_DASHBOARD_PATH): Promise<DashboardPages> {
    await test.step("Sign in and open the data dashboard", async () => {
      await this.page.goto(`${this.origin()}${path}`);
      await expect(this.page).toHaveTitle(/HMPPS Digital Services - Sign in/);
      await this.page.fill("#username", env.deliusUsername());
      await this.page.fill("#password", env.deliusPassword());
      await this.page.click("#submit");
      await this.pages.overall.isOnPage();
    });
    return this.pages;
  }

  private url(
    path: string,
    monthFrom?: YearMonth,
    monthTo?: YearMonth,
  ): string {
    const base = `${this.origin()}${path}`;
    if (!monthFrom && !monthTo) return base;

    const params = new URLSearchParams();
    if (monthFrom) params.set("monthFrom", monthFrom);
    if (monthTo) params.set("monthTo", monthTo);
    return `${base}?${params.toString()}`;
  }

  async openOverall(
    monthFrom?: YearMonth,
    monthTo?: YearMonth,
  ): Promise<DashboardPages> {
    await this.page.goto(this.url(DATA_DASHBOARD_PATH, monthFrom, monthTo));
    return this.pages;
  }

  async openByRegion(
    monthFrom?: YearMonth,
    monthTo?: YearMonth,
  ): Promise<DashboardPages> {
    await this.page.goto(this.url(REGION_DASHBOARD_PATH, monthFrom, monthTo));
    return this.pages;
  }

  async applyRange(monthFrom: YearMonth, monthTo: YearMonth): Promise<void> {
    await test.step(`Filter ${monthFrom} to ${monthTo}`, async () => {
      await this.pages.overall.selectMonthRange(monthFrom, monthTo);
      await this.pages.overall.applyFilters();
    });
  }
}
