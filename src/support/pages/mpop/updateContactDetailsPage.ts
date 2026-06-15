import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export interface ContactDetails {
  phone?: string;
  mobile?: string;
  email?: string;
}

export default class UpdateContactDetailsPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Edit contact details for");
  }

  async completePage(contacts: ContactDetails): Promise<void> {
    if (contacts.phone !== undefined) {
      await this.fillText("phoneNumber", contacts.phone);
    }
    if (contacts.mobile !== undefined) {
      await this.fillText("mobileNumber", contacts.mobile);
    }
    if (contacts.email !== undefined) {
      const email = this.page
        .locator('[data-qa="emailAddress"],[data-qa="editEmail"]')
        .getByRole("textbox");
      await email.clear();
      await email.fill(contacts.email);
    }
    await this.clickContinue();
  }
}
