import { Page, Locator } from "@playwright/test";
import { Preference } from "../../../data/models";

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

  private textMessageRadio(): Locator {
    return textMessageRadio(this.page);
  }

  private emailRadio(): Locator {
    return emailRadio(this.page);
  }

  private continueButton(): Locator {
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
    // .first(): unscoped, so a second table on the page would otherwise be a strict
    // mode violation rather than a useful failure.
    return this.page.locator("caption.govuk-table__caption").first();
  }

  /**
   * The confirm page's radios. Their data-qa is checkInConfirmPreferredComs, where
   * the preference page's is checkInPreferredComs.
   */
  confirmRadiosGroup(): Locator {
    return this.page.locator('[data-qa="checkInConfirmPreferredComs"]');
  }

  /**
   * The detail held in NDelius that the page is asking us to confirm. Positional,
   * but the template renders exactly one table with one row - a <th> label and this
   * <td> value - so the first cell is the value.
   */
  confirmedContactValue(): Locator {
    return this.page.locator("table.govuk-table td.govuk-table__cell").first();
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
  //
  // This is the wizard's own edit page, not the manage page's. Both share the page
  // title "Edit contact details for the person" but render different fields: the
  // wizard asks only for the detail matching the chosen preference, the manage page
  // shows both. EditContactDetailsPage models the other one.
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
