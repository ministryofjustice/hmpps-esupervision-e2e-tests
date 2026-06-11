import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import ContactDetailsPage, { ContactDetails } from "./updateContactDetailsPage";

export enum Preference {
  TEXT = 0,
  EMAIL = 1,
}

export type { ContactDetails };

export type contactMethod =
  | "Text message"
  | "email"
  | "textUpdate"
  | "emailUpdate";

export default class ContactPreferencePage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Contact preferences");
  }

  async completePage(preference: Preference, contact?: ContactDetails) {
    await this.changePage(contact, preference);
  }

  async changePage(contact?: ContactDetails, preference?: Preference) {
    if (contact?.email || contact?.mobile) {
      if (contact.mobile) {
        await this.getQA("mobileNumberAction").click();
      } else {
        await this.getQA("emailAddressAction").click();
      }
      const contactDetailsPage = new ContactDetailsPage(this.page);
      await contactDetailsPage.assertOnPage();
      await contactDetailsPage.completePage(contact);
    }

    if (preference !== undefined) {
      await this.clickRadioById("checkInPreferredComs", preference);
    }
    await this.getQA("submitBtn").click();
  }
}
