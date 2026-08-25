import { Page, Locator } from "@playwright/test";
import { Preference } from "../mpop/contactPreferencePage";

// Shared with ContactDetailsPage, which renders the same preference radios on the
// manage page.
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

  // Shown after choosing a preference when NDelius already holds the detail.
  confirmDetailsGroup(): Locator {
    return this.page.getByRole("group", {
      name: /Is this the right (email address|mobile number) for .+\?/,
    });
  }

  confirmYesRadio(): Locator {
    return this.confirmDetailsGroup().getByRole("radio", { name: "Yes" });
  }

  /** "No, I need to change the email address" - the route to the edit page. */
  confirmChangeRadio(): Locator {
    return this.confirmDetailsGroup().getByRole("radio", {
      name: /No, I need to change the (email address|mobile number)/,
    });
  }

  /** Table caption, e.g. "Confirm Tara's email address". */
  confirmCaption(): Locator {
    return this.page.locator("caption.govuk-table__caption");
  }

  /** The detail held in NDelius that the page is asking us to confirm. */
  confirmedContactValue(): Locator {
    return this.page.locator("td.govuk-table__cell").first();
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

  /** Answer "No, I need to change ..." - routes to the edit contact page. */
  async rejectDetailsAndContinue(): Promise<void> {
    await this.confirmChangeRadio().check();
    await this.continueButton().click();
  }

  // Shown instead of confirmDetailsGroup when the detail isn't on file yet.
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
