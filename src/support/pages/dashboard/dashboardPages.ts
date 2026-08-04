import { type Page } from "@playwright/test";
import DashboardTabs from "./dashboardTabs";
import Footer from "./footer";
import Header from "./header";
import OverallPage from "./overallPage";
import PhaseBanner from "./phaseBanner";
import RegionPage from "./regionPage";

export class DashboardPages {
  readonly overall: OverallPage;
  readonly region: RegionPage;
  readonly tabs: DashboardTabs;
  readonly header: Header;
  readonly phaseBanner: PhaseBanner;
  readonly footer: Footer;

  constructor(page: Page) {
    this.overall = new OverallPage(page);
    this.region = new RegionPage(page);
    this.tabs = new DashboardTabs(page);
    this.header = new Header(page);
    this.phaseBanner = new PhaseBanner(page);
    this.footer = new Footer(page);
  }
}
