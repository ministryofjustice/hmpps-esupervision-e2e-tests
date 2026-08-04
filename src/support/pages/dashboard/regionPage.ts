import { expect, type Page } from "@playwright/test";
import DashboardBasePage from "../base/dashboardBasePage";
import MatrixTable from "./matrixTable";

import {
  type MatrixTitle,
  REGION_MATRIX_PEOPLE,
} from "../../../data/dashboard/tables";
import { DATA_DASHBOARD_HEADING } from "../../../data/dashboard/layoutConstants";

export default class RegionPage extends DashboardBasePage {
  constructor(page: Page) {
    super(page, DATA_DASHBOARD_HEADING);
  }

  matrix(title: MatrixTitle): MatrixTable {
    return new MatrixTable(this.page, title);
  }

  // Both tabs share the H1, so anchor on something only this tab renders.
  async assertOnPage(): Promise<void> {
    await super.assertOnPage();
    await expect(this.matrix(REGION_MATRIX_PEOPLE).locator()).toBeVisible();
  }
}
