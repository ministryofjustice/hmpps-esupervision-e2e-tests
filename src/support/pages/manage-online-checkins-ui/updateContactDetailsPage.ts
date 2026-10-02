import { Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";
import { ContactDetails } from "../../../data/models";

// Reached from the restart flow's contact page (see
// ContactPreferencePage.setContactDetails).
export default class UpdateContactDetailsPage extends PractitionerBasePage {
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
