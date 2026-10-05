import { expect, Locator, Page } from "@playwright/test";
import { env } from "../../../config/env";

export default class SignInPage {
  constructor(private readonly page: Page) {}

  usernameField(): Locator {
    return this.page.locator("#username");
  }

  passwordField(): Locator {
    return this.page.locator("#password");
  }

  submitButton(): Locator {
    return this.page.locator("#submit");
  }

  async completeSignIn(): Promise<void> {
    await expect(this.page).toHaveTitle(/HMPPS Digital Services - Sign in/);
    await this.usernameField().fill(env.deliusUsername());
    await this.passwordField().fill(env.deliusPassword());
    await this.submitButton().click();
  }
}
