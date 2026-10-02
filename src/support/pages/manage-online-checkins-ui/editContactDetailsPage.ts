import { Locator, Page } from "@playwright/test";
import { errorSummary, fieldError } from "../base/errors";

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
    return errorSummary(this.page);
  }

  fieldError(message: string): Locator {
    return fieldError(this.page, message);
  }
}
