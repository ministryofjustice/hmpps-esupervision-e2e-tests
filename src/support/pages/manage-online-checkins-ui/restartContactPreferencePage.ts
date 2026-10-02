import { Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";
import UpdateContactDetailsPage from "./updateContactDetailsPage";
import { Preference, ContactDetails } from "../../../data/models";

export default class RestartContactPreferencePage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "Contact details");
  }

  async completePage(
    preference: Preference,
    contact?: ContactDetails,
  ): Promise<void> {
    if (contact) {
      await this.setContactDetails(contact);
    }
    await this.clickRadioById("checkInPreferredComs", preference);
    await this.clickContinue();
  }

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
