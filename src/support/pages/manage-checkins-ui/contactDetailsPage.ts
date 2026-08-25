import { Locator, Page } from "@playwright/test";
import { Preference } from "../mpop/contactPreferencePage";
import {
  preferenceGroup,
  textMessageRadio,
  emailRadio,
} from "./contactPreferencePage";

// The "Change contact details" page reached from an active check in's manage page:
// current details and preference radios saved together. Distinct from
// ContactPreferencePage, which models the setup wizard's multi-step flow.
export default class ContactDetailsPage {
  constructor(private readonly page: Page) {}

  preferenceGroup(): Locator {
    return preferenceGroup(this.page);
  }

  textMessageRadio(): Locator {
    return textMessageRadio(this.page);
  }

  emailRadio(): Locator {
    return emailRadio(this.page);
  }

  /** The mobile number currently held on the record, as this page renders it. */
  mobileNumberValue(): Locator {
    return this.page.locator('[data-qa="mobileNumberValue"]');
  }

  changeMobileNumberButton(): Locator {
    return this.page.getByRole("button", { name: "Change mobile number" });
  }

  changeEmailAddressButton(): Locator {
    return this.page.getByRole("button", { name: "Change email address" });
  }

  saveChangesButton(): Locator {
    return this.page.getByRole("button", { name: "Save changes" });
  }

  async selectPreference(preference: Preference): Promise<void> {
    const radio =
      preference === Preference.EMAIL
        ? this.emailRadio()
        : this.textMessageRadio();
    await radio.check();
  }

  async save(): Promise<void> {
    await this.saveChangesButton().click();
  }
}
