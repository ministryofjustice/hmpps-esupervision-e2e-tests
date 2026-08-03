import { Locator, Page } from "@playwright/test";
import DashboardBasePage from "../base/dashboardBasePage";
import { DATA_DASHBOARD_HEADING } from "../../../data/dashboard/dataDashboardConstants";

/**
 * The "Data by Region" tab at /v2statistics/region.
 *
 * Each matrix is a scrollable pane with role="region", labelled by its title.
 * Within a row the cells are: a row header, then a number and a percentage for
 * the Total, then a number and a percentage per region, with aria-hidden spacer
 * cells between the groups.
 *
 * Cells are located by their `esup-matrix__num` / `esup-matrix__pct` classes
 * rather than by position, so the spacers cannot shift the indices: index 0 is
 * always the Total and index n+1 is always the nth region.
 */
export default class RegionPage extends DashboardBasePage {
  constructor(page: Page) {
    super(page, DATA_DASHBOARD_HEADING);
  }

  matrix(title: string): Locator {
    return this.page.getByRole("region", { name: title });
  }

  matrixTitle(title: string): Locator {
    return this.page.getByRole("heading", { level: 2, name: title });
  }

  /**
   * Region column headings in rendered order. The first `esup-matrix__group`
   * heading is always "Total", so it is excluded.
   */
  private regionHeadings(title: string): Locator {
    return this.matrix(title)
      .locator("thead th.esup-matrix__group")
      .nth(0)
      .locator(
        "xpath=following-sibling::th[contains(@class,'esup-matrix__group')]",
      );
  }

  async regionNames(title: string): Promise<string[]> {
    return this.regionHeadings(title).evaluateAll((headings) =>
      headings.map((heading) => (heading.textContent ?? "").trim()),
    );
  }

  /** A row within a matrix, located by a fragment of its row header. */
  matrixRow(title: string, label: RegExp): Locator {
    return this.matrix(title)
      .locator("tbody tr")
      .filter({
        has: this.page.locator("th.esup-matrix__rowhead", { hasText: label }),
      });
  }

  /** Number cells in a row: index 0 is the Total, index n+1 is region n. */
  numberCells(title: string, label: RegExp): Locator {
    return this.matrixRow(title, label).locator("td.esup-matrix__num");
  }

  /** Percentage cells in a row: index 0 is the Total, index n+1 is region n. */
  percentageCells(title: string, label: RegExp): Locator {
    return this.matrixRow(title, label).locator("td.esup-matrix__pct");
  }
}
