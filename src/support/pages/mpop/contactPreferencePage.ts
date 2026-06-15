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
    if (contact) {
      await this.addMissingContactDetails(contact);
    }
    if (preference !== undefined) {
      await this.clickRadioById("checkInPreferredComs", preference);
    }
    await this.clickContinue();
  }

  private async addMissingContactDetails(
    contact: ContactDetails,
  ): Promise<void> {
    const addMobile =
      contact.mobile !== undefined &&
      (await this.isMissing("mobileNumberValue"));
    const addEmail =
      contact.email !== undefined &&
      (await this.isMissing("emailAddressValue"));
    if (!addMobile && !addEmail) return;

    await this.getQA(
      addMobile ? "mobileNumberAction" : "emailAddressAction",
    ).click();

    const details = new UpdateContactDetailsPage(this.page);
    await details.assertOnPage();
    await details.completePage({
      mobile: addMobile ? contact.mobile : undefined,
      email: addEmail ? contact.email : undefined,
    });
  }

  private async isMissing(valueQa: string): Promise<boolean> {
    const value = this.getQA(valueQa);
    if ((await value.count()) === 0) return true;
    const text = (await value.textContent())?.trim() ?? "";
    return text === "" || /^No\b/i.test(text);
  }
}
