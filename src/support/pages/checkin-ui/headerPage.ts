import { Locator, Page } from "@playwright/test";

export default class HeaderPage {
  constructor(private readonly page: Page) {}

  cymraegLink(): Locator {
    return this.page.getByRole("link", { name: "Cymraeg" });
  }

  async switchToWelsh(): Promise<void> {
    await this.cymraegLink().click();
  }
}
