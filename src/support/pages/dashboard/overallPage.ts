import { expect, type Page } from "@playwright/test";
import DashboardBasePage from "../base/dashboardBasePage";
import { DATA_DASHBOARD_HEADING } from "../../../data/dashboard/layoutConstants";
import {
  OVERALL_TABLE_CAPTIONS,
  TABLE_PEOPLE,
  type TableCaption,
} from "../../../data/dashboard/tables";
import TotalsTable from "./totalsTable";

export default class OverallPage extends DashboardBasePage {
  constructor(page: Page) {
    super(page, DATA_DASHBOARD_HEADING);
  }

  table(caption: TableCaption): TotalsTable {
    return new TotalsTable(this.page, caption);
  }

  async assertOnPage(): Promise<void> {
    await super.assertOnPage();
    await expect(this.table(TABLE_PEOPLE).locator()).toBeVisible();
  }

  async allTotals(): Promise<string[]> {
    const perTable = await Promise.all(
      OVERALL_TABLE_CAPTIONS.map((caption) => this.table(caption).totals()),
    );
    return perTable.flat();
  }
}
