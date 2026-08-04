import { type Locator, type Page } from "@playwright/test";

export default class DashboardTabs {
  constructor(private readonly page: Page) {}

  private navigation(): Locator {
    return this.page.locator(".moj-sub-navigation");
  }

  tab(name: string): Locator {
    return this.navigation().getByRole("link", { name, exact: true });
  }

  async open(name: string): Promise<void> {
    await this.tab(name).click();
  }
}
