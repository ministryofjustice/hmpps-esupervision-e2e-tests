import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import { ContactDetails } from "../../../data/models";

// Not legacy-MPOP-only: also reached from the restart flow's MOCI page (see
// ContactPreferencePage.setContactDetails), so this stays even once legacy MPOP
// is removed.
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
