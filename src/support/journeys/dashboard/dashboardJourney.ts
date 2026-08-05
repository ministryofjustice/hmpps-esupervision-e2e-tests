import { expect, test, type Page } from "@playwright/test";
import { env } from "../../../config/env";
import type DashboardBasePage from "../../pages/base/dashboardBasePage";
import { DashboardPages } from "../../pages/dashboard/dashboardPages";
import {
  type DashboardTab,
  DATA_DASHBOARD_PATH,
  REGION_DASHBOARD_PATH,
} from "../../../data/dashboard/routes";
import {
  QUERY_MONTH_FROM,
  QUERY_MONTH_TO,
} from "../../../data/dashboard/filters";
import { type YearMonth } from "../../utils/dashboard/yearMonth";
import { DASHBOARD_STORAGE_STATE } from "../../utils/paths";

const baseUrl = (): string => env.dashboardUrl();

export default class DashboardJourney {
  readonly pages: DashboardPages;

  constructor(private readonly page: Page) {
    this.pages = new DashboardPages(page);
  }

  async submitSignIn(username: string, password: string): Promise<void> {
    await expect(this.page).toHaveTitle(/HMPPS Digital Services - Sign in/);
    await this.page.fill("#username", username);
    await this.page.fill("#password", password);
    await this.page.click("#submit");
  }

  async signIn(): Promise<DashboardPages> {
    await test.step("Sign in and open the data dashboard", async () => {
      await this.gotoDashboard();
      await this.submitSignIn(env.deliusUsername(), env.deliusPassword());
      await this.pages.overall.assertOnPage();
      await this.page.context().storageState({ path: DASHBOARD_STORAGE_STATE });
    });
    return this.pages;
  }

  private url(
    path: string,
    monthFrom?: YearMonth,
    monthTo?: YearMonth,
  ): string {
    if (!monthFrom && !monthTo) return path;
    const params = new URLSearchParams();
    if (monthFrom) params.set(QUERY_MONTH_FROM, monthFrom);
    if (monthTo) params.set(QUERY_MONTH_TO, monthTo);
    return `${path}?${params.toString()}`;
  }

  async gotoDashboard(): Promise<void> {
    await this.page.goto(new URL(DATA_DASHBOARD_PATH, baseUrl()).toString());
  }

  async openOverall(
    monthFrom?: YearMonth,
    monthTo?: YearMonth,
  ): Promise<DashboardPages> {
    await this.page.goto(
      new URL(
        this.url(DATA_DASHBOARD_PATH, monthFrom, monthTo),
        baseUrl(),
      ).toString(),
    );
    await this.pages.overall.assertOnPage();
    return this.pages;
  }

  async openByRegion(
    monthFrom?: YearMonth,
    monthTo?: YearMonth,
  ): Promise<DashboardPages> {
    await this.page.goto(
      new URL(
        this.url(REGION_DASHBOARD_PATH, monthFrom, monthTo),
        baseUrl(),
      ).toString(),
    );
    await this.pages.region.assertOnPage();
    return this.pages;
  }

  private pageFor(tab: DashboardTab): DashboardBasePage {
    return tab.path === REGION_DASHBOARD_PATH
      ? this.pages.region
      : this.pages.overall;
  }

  async openTab(tab: DashboardTab): Promise<DashboardPages> {
    await test.step(`Open the "${tab.name}" tab`, async () => {
      await this.pages.tabs.open(tab.name);
      await this.page.waitForURL((url) => url.pathname === tab.path);
      await this.pageFor(tab).assertOnPage();
    });
    return this.pages;
  }

  async applyRange(
    on: DashboardBasePage,
    monthFrom: YearMonth,
    monthTo: YearMonth,
  ): Promise<void> {
    await test.step(`Filter ${monthFrom} to ${monthTo}`, async () => {
      await on.selectMonthRange(monthFrom, monthTo);
      await on.applyFilters(monthFrom, monthTo);
      await on.assertOnPage();
      await expect(
        on.errorSummary(),
        `${monthFrom} to ${monthTo} was rejected by the dashboard`,
      ).toHaveCount(0);
    });
  }
}
