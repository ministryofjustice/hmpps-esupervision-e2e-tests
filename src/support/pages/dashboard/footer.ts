import { type Locator, type Page } from "@playwright/test";
import { exactText } from "../../utils/dashboard/textMatching";

export default class Footer {
  constructor(private readonly page: Page) {}

  footer(): Locator {
    return this.page.locator(".govuk-footer");
  }

  footerLink(name: string): Locator {
    return this.footer().getByRole("link", { name: exactText(name) });
  }
}
