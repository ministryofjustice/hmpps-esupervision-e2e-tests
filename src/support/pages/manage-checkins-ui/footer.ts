import { Locator, Page } from "@playwright/test";

export default class Footer {
  constructor(private readonly page: Page) {}

  footer(): Locator {
    return this.page.getByRole("contentinfo");
  }

  footerlink(name: string): Locator {
    return this.footer().getByRole("link", { name: new RegExp(name, "i") });
  }
}
