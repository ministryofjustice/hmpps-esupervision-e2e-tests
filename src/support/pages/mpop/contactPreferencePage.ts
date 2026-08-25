import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import UpdateContactDetailsPage from "./updateContactDetailsPage";
import { Preference, ContactDetails } from "../../../data/models";


export default class ContactPreferencePage extends MPopBasePage {
  constructor(page: Page, restart = false) {
    super(page, restart ? "Contact details" : "Contact preferences");
  }

  async completePage(
    preference: Preference,
    contact?: ContactDetails,
  ): Promise<void> {
    await this.changePage(preference, contact);
  }

  async changePage(
    preference?: Preference,
    contact?: ContactDetails,
  ): Promise<void> {
    if (contact) {
      await this.setContactDetails(contact);
    }
    if (preference !== undefined) {
      await this.clickRadioById("checkInPreferredComs", preference);
    }
    await this.clickContinue();
  }

  // TODO(legacy-mpop): Delete this method and its call above when legacy MPOP is
  // removed. Only MPOP has these inline Change actions; MOCI routes through its
  // confirm and edit pages instead.
  private async setContactDetails(contact: ContactDetails): Promise<void> {
    if (contact.mobile === undefined && contact.email === undefined) return;

    await this.getQA(
      contact.mobile !== undefined
        ? "mobileNumberAction"
        : "emailAddressAction",
    ).click();

    const details = new UpdateContactDetailsPage(this.page);
    await details.assertOnPage();
    await details.completePage(contact);
  }
}
