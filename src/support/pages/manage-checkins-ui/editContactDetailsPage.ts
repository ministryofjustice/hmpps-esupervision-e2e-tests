import { Locator, Page } from "@playwright/test";

export default class EditContactDetailsPage {
  constructor(private readonly page: Page) {}

  mobileNumberField(): Locator {
    return this.page.getByRole("textbox", {
      name: "Mobile number (optional)",
    });
  }

  emailAddressField(): Locator {
    return this.page.getByRole("textbox", {
      name: "Email address (optional)",
    });
  }

  saveChangesButton(): Locator {
    return this.page.getByRole("button", { name: "Save changes" });
  }

  async save(): Promise<void> {
    await this.saveChangesButton().click();
  }

  errorSummary(): Locator {
    return this.page.locator(".govuk-error-summary");
  }

  fieldError(message: string): Locator {
    return this.page.locator(".govuk-error-message", { hasText: message });
  }
}
