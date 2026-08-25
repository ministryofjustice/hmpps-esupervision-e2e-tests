import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import { ContactDetails } from "../../../data/models";

// Only reached from MPOP's inline Change actions.
// TODO(legacy-mpop): Delete this whole file when legacy MPOP is removed. Nothing
// else needs it - ContactDetails now lives in src/data/contact.ts.
export default class UpdateContactDetailsPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Edit contact details for");
  }

  async completePage(contacts: ContactDetails): Promise<void> {
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
