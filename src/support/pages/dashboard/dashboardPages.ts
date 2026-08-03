import { Page } from "@playwright/test";
import LayoutPage from "./layoutPage";
import OverallPage from "./overallPage";
import RegionPage from "./regionDashboardPage";

export class DashboardPages {
  readonly overall: OverallPage;
  readonly region: RegionPage;
  readonly layout: LayoutPage;

  constructor(page: Page) {
    this.overall = new OverallPage(page);
    this.region = new RegionPage(page);
    this.layout = new LayoutPage(page);
  }
}
