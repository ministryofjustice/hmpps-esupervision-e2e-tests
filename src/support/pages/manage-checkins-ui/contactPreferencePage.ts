import { Locator, Page } from "@playwright/test";
import { Preference } from "../mpop/contactPreferencePage";

// Shared with ContactDetailsPage, which renders the same preference radios
// on a different screen (direct "Change contact details" link vs this
export function preferenceGroup(page: Page): Locator {
  return page.getByRole("group", {
    name: /How does .+ want us to send a link to the service\?/,
  });
}

export function textMessageRadio(page: Page): Locator {
  return preferenceGroup(page).getByRole("radio", { name: "Text message" });
}

export function emailRadio(page: Page): Locator {
  return preferenceGroup(page).getByRole("radio", { name: "Email" });
}

export default class ContactPreferencePage {
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

  continueButton(): Locator {
    return this.page.getByRole("button", { name: "Continue" });
  }

  // After choosing a preference, the app asks to confirm the matching contact
  // detail already held in NDelius before moving on.
  confirmDetailsGroup(): Locator {
    return this.page.getByRole("group", {
      name: /Is this the right (email address|mobile number) for .+\?/,
    });
  }

  confirmYesRadio(): Locator {
    return this.confirmDetailsGroup().getByRole("radio", { name: "Yes" });
  }

  async selectPreferenceAndContinue(preference: Preference): Promise<void> {
    const radio =
      preference === Preference.EMAIL
        ? this.emailRadio()
        : this.textMessageRadio();
    await radio.check();
    await this.continueButton().click();
  }

  async confirmDetailsAndContinue(): Promise<void> {
    await this.confirmYesRadio().check();
    await this.continueButton().click();
  }

  // Shown instead of confirmDetailsGroup when the chosen preference's contact detail
  // isn't on file in NDelius yet, e.g. "What is Tara's mobile number?"
  missingDetailsField(): Locator {
    return this.page.getByRole("textbox", {
      name: /What is .+'s (mobile number|email address)\?/,
    });
  }

  async enterMissingDetailsAndContinue(value: string): Promise<void> {
    await this.missingDetailsField().fill(value);
    await this.continueButton().click();
  }
}
