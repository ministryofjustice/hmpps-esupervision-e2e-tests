import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import UpdateContactDetailsPage, {
  ContactDetails,
} from "./updateContactDetailsPage";

export enum Preference {
  TEXT = 0,
  EMAIL = 1,
}

export type { ContactDetails };

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

  // Applies whatever is supplied, whether the detail is on file already or not -
  // the new UI's confirm step behaves the same way.
  //
  // TODO(legacy-mpop): delete this method and its call above once MPOP check ins
  // are retired. Only MPOP has these inline Change actions.
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
