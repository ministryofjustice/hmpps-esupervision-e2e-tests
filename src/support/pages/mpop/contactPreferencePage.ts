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
    await this.changePage(preference, contact);
  }

  async changePage(
    preference?: Preference,
    contact?: ContactDetails,
  ): Promise<void> {
    if (contact?.mobile !== undefined || contact?.email !== undefined) {
      await this.getQA(
        contact.mobile !== undefined
          ? "mobileNumberAction"
          : "emailAddressAction",
      ).click();

      const details = new ContactDetailsPage(this.page);
      await details.assertOnPage();
      await details.completePage(contact);
    }

    if (preference !== undefined) {
      await this.clickRadioById("checkInPreferredComs", preference);
    }
    await this.continueButton();
  }
}
