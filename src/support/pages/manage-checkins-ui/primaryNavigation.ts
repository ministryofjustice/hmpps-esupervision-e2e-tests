import { Page, Locator } from "@playwright/test";

export default class PrimaryNavigation {
  constructor(private readonly page: Page) {}

  nav(): Locator {
    return this.page.getByRole("navigation", { name: "Primary navigation" });
  }

  navLink(name: string): Locator {
    return this.nav().getByRole("link", { name, exact: false });
  }

  alertsBadge(): Locator {
    return this.navLink("Alerts").locator(
      '.moj-notification-badge [aria-hidden="true"]',
    );
  }
}
