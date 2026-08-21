import { Locator, Page } from "@playwright/test";
import { Preference } from "../mpop/contactPreferencePage";
import {
  preferenceGroup,
  textMessageRadio,
  emailRadio,
} from "./contactPreferencePage";

// The direct "Change contact details" link on an active check in's manage
// page - a single page combining the current contact details (each with its
// own "Change" button to a shared edit-contact sub-page) and the preference
// radios, submitted with one "Save changes" button. Distinct from
// ContactPreferencePage, which models the multi-step setup wizard flow.
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
