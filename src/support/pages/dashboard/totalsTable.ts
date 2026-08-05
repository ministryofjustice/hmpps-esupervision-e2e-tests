import { expect, type Locator, type Page } from "@playwright/test";
import {
  normalisedTexts,
  type RowValue,
} from "../../utils/dashboard/dashboardTables";
import { exactText } from "../../utils/dashboard/textMatching";

const LABEL_COLUMN = 1;
const TOTAL_COLUMN = 2;
const PERCENTAGE_COLUMN = 3;

export default class TotalsTable {
  constructor(
    private readonly page: Page,
    private readonly caption: string,
  ) {}

  locator(): Locator {
    return this.page.locator("table.govuk-table").filter({
      has: this.page.locator("caption", { hasText: exactText(this.caption) }),
    });
  }

  private row(label: string): Locator {
    return this.locator()
      .locator("tbody tr")
      .filter({
        has: this.page.locator("td:first-child", { hasText: exactText(label) }),
      });
  }

  private column(position: number): Promise<string[]> {
    return normalisedTexts(
      this.locator().locator(`tbody tr td:nth-child(${position})`),
    );
  }

  rowLabels(): Promise<string[]> {
    return this.column(LABEL_COLUMN);
  }

  totals(): Promise<string[]> {
    return this.column(TOTAL_COLUMN);
  }

  totalCell(label: string): Locator {
    return this.row(label).locator(`td:nth-child(${TOTAL_COLUMN})`);
  }

  percentageCell(label: string): Locator {
    return this.row(label).locator(`td:nth-child(${PERCENTAGE_COLUMN})`);
  }

  async rowValues(): Promise<RowValue[]> {
    const [labels, totals, percentages] = await Promise.all([
      this.column(LABEL_COLUMN),
      this.column(TOTAL_COLUMN),
      this.column(PERCENTAGE_COLUMN),
    ]);
    expect(
      totals,
      `${this.caption} has ${labels.length} rows but ${totals.length} Total cells, so the columns no longer line up`,
    ).toHaveLength(labels.length);
    expect(
      percentages,
      `${this.caption} has ${labels.length} rows but ${percentages.length} percentage cells, so the columns no longer line up`,
    ).toHaveLength(labels.length);
    return labels.map((label, index) => ({
      label,
      total: totals[index],
      percentage: percentages[index],
    }));
  }
}
