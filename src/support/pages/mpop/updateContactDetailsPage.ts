import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export interface ContactDetails {
  phone?: string;
  mobile?: string;
  email?: string;
}

export default class ContactDetailsPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Edit contact details for");
  }

  async completePage(contacts: ContactDetails) {
    if (contacts.phone != undefined) {
      await this.fillText("phoneNumber", contacts.phone);
    }
    if (contacts.mobile != undefined) {
      await this.fillText("mobileNumber", contacts.mobile);
    }
    if (contacts.email != undefined) {
      await this.page
        .locator('[data-qa="emailAddress"],[data-qa="editEmail"]')
        .getByRole("textbox")
        .fill(contacts.email);
    }
    await this.continueButton();
  }
}
