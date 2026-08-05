import { expect, type Locator, type Page } from "@playwright/test";
import { normalisedTexts } from "../../utils/dashboard/dashboardTables";

const TOTAL_COLUMN_NAME = "Total";

export default class MatrixTable {
  constructor(
    private readonly page: Page,
    private readonly title: string,
  ) {}

  locator(): Locator {
    return this.page.getByRole("region", { name: this.title, exact: true });
  }

  heading(): Locator {
    return this.page.getByRole("heading", {
      level: 2,
      name: this.title,
      exact: true,
    });
  }

  async regionNames(): Promise<string[]> {
    const headings = await normalisedTexts(
      this.locator().locator("thead th.esup-matrix__group"),
    );
    expect(
      headings[0],
      `${this.title}: first column heading is not ${TOTAL_COLUMN_NAME}`,
    ).toEqual(TOTAL_COLUMN_NAME);
    return headings.slice(1);
  }

  async columnNames(): Promise<string[]> {
    return [TOTAL_COLUMN_NAME, ...(await this.regionNames())];
  }

  private row(label: RegExp): Locator {
    return this.locator()
      .locator("tbody tr")
      .filter({
        has: this.page.locator("th.esup-matrix__rowhead", { hasText: label }),
      });
  }

  numberCells(label: RegExp): Locator {
    return this.row(label).locator("td.esup-matrix__num");
  }

  percentageCells(label: RegExp): Locator {
    return this.row(label).locator("td.esup-matrix__pct");
  }

  numberCellTexts(label: RegExp): Promise<string[]> {
    return normalisedTexts(this.numberCells(label));
  }
}
