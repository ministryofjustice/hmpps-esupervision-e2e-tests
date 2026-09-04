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

  resultRows(): Locator {
    return this.resultsTable().locator("tbody tr");
  }

  // Matches by DOB across all rows, not just the first - avoids returning an
  // unrelated offender's CRN when several rows share a name/sex/provider.
  async findCrnByDob(dob: string): Promise<string | undefined> {
    const rows = this.resultRows();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const rowDob = (await row.locator("td").nth(2).innerText()).trim();
      if (rowDob !== dob) {
        continue;
      }
      // The CRN cell has a hidden sort-key span that corrupts a plain
      // textContent() read, so use innerText() instead - it reflects rendered
      // text and excludes hidden content regardless of how it's hidden.
      const crn = (await row.locator("td").nth(0).innerText()).trim();
      return crn || undefined;
    }
    return undefined;
  }
}
