import { Locator, Page } from "@playwright/test";

export default class NationalSearchPage {
  constructor(private readonly page: Page) {}

  link(): Locator {
    return this.page.locator("a", { hasText: "National search" });
  }

  // Kept as a raw selector, not a Locator - the vendored selectOption()
  // helper takes a CSS selector string rather than a Locator.
  readonly otherIdentifierSelector = "#otherIdentifier";

  crnInput(): Locator {
    return this.page.locator("#crn\\:inputText");
  }

  searchButton(): Locator {
    return this.page.locator("#searchButton");
  }

  viewLinkForCrn(crn: string): Locator {
    return this.page
      .locator("tr", { hasText: crn })
      .locator("a", { hasText: "View" })
      .first();
  }

  resultsTable(): Locator {
    return this.page.locator("#offendersTable");
  }

  firstResultRow(): Locator {
    return this.resultsTable().locator("tbody tr:first-child");
  }

  // The CRN cell has a hidden sort-key span that corrupts a plain
  // textContent() read, so use innerText() instead - it reflects rendered
  // text and excludes hidden content regardless of how it's hidden.
  async firstResultCrn(): Promise<string | undefined> {
    const text = await this.firstResultRow().locator("td").nth(0).innerText();
    return text.trim() || undefined;
  }

  async firstResultDob(): Promise<string | undefined> {
    const text = await this.firstResultRow().locator("td").nth(2).textContent();
    return text?.trim() ?? undefined;
  }
}
