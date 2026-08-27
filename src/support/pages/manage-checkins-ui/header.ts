import { Page, Locator } from "@playwright/test";

export default class Header {
  constructor(private readonly page: Page) {}

  header(): Locator {
    return this.page.locator("header.probation-common-header");
  }

  userName(): Locator {
    return this.header().locator(
      '[data-qa="probation-common-header-user-name"]',
    );
  }

  accountMenuToggle(): Locator {
    return this.header().locator(
      "button.probation-common-header__user-menu-toggle",
    );
  }

  /** Only visible once accountMenuToggle() has been clicked open. */
  signOutLink(): Locator {
    return this.header().getByRole("link", { name: "Sign out" });
  }
}
