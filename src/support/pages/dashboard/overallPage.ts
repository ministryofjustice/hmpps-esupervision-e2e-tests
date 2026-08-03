import { Locator, Page } from "@playwright/test";
import DashboardBasePage from "../base/dashboardBasePage";
import { DATA_DASHBOARD_HEADING } from "../../../data/dashboard/dataDashboardConstants";

/**
 * The "Overall" tab at /v2statistics: six govukTable blocks of national figures
 * plus the shared month filter.
 */
export default class OverallPage extends DashboardBasePage {
  constructor(page: Page) {
    super(page, DATA_DASHBOARD_HEADING);
  }

  table(caption: string): Locator {
    return this.tableByCaption(caption);
  }

  /** Every row label in a table, in rendered order. */
  async rowLabels(caption: string): Promise<string[]> {
    return this.table(caption)
      .locator("tbody tr td:first-child")
      .evaluateAll((cells) =>
        cells.map((cell) => (cell.textContent ?? "").trim()),
      );
  }

  /**
   * The "Total" column for the row with the given label. The row is matched on
   * its first cell so that a label which also appears elsewhere in the row
   * cannot select the wrong one. These tables do not set firstCellIsHeader, so
   * every cell is a <td>: index 0 is the label, 1 the Total, 2 the percentage.
   */
  totalCell(caption: string, label: string): Locator {
    return this.table(caption)
      .locator("tbody tr")
      .filter({
        has: this.page.locator("td:first-child", { hasText: label }),
      })
      .locator("td")
      .nth(1);
  }

  /** The percentage column for the row with the given label. */
  percentageCell(caption: string, label: string): Locator {
    return this.table(caption)
      .locator("tbody tr")
      .filter({
        has: this.page.locator("td:first-child", { hasText: label }),
      })
      .locator("td")
      .nth(2);
  }

  /**
   * Label, Total and percentage for every row in a table, in rendered order.
   * Columns are read separately rather than by walking the DOM, so the same
   * cell indices apply here as everywhere else in this page object.
   */
  async rowValues(
    caption: string,
  ): Promise<{ label: string; total: string; percentage: string }[]> {
    const table = this.table(caption);
    const column = (position: number) =>
      table.locator(`tbody tr td:nth-child(${position})`).allInnerTexts();

    const [labels, totals, percentages] = await Promise.all([
      column(1),
      column(2),
      column(3),
    ]);

    return labels.map((label, index) => ({
      label: label.trim(),
      total: (totals[index] ?? "").trim(),
      percentage: (percentages[index] ?? "").trim(),
    }));
  }

  /**
   * Every Total column value on the Overall tab, in rendered order. Used to
   * compare one filtered view against another, so it deliberately spans all six
   * tables. The matrix tables on the region tab are excluded.
   */
  async allTotals(): Promise<string[]> {
    return this.page
      .locator("table.govuk-table:not(.esup-matrix) tbody tr td:nth-child(2)")
      .evaluateAll((cells) =>
        cells.map((cell) => (cell.textContent ?? "").trim()),
      );
  }
}
