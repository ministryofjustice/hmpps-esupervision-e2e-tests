import { Locator, Page } from "@playwright/test";

export default class OffenderRecordPage {
  constructor(private readonly page: Page) {}

  eventListLink(): Locator {
    return this.page.getByRole("link", { name: "Event List" });
  }

  deleteEventLink(): Locator {
    return this.page.getByRole("link", { name: "delete" });
  }

  personalDetailsLink(): Locator {
    return this.page.getByRole("link", { name: "Personal Details" });
  }

  deleteButton(): Locator {
    return this.page.getByRole("button", { name: "Delete" });
  }

  confirmButton(): Locator {
    return this.page.getByRole("button", { name: "Confirm" });
  }
}
