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

const SIGN_IN_ATTEMPTS = 3;

/**
 * Waits for sign-in to return to the service, and signs in again if its
 * callback failed. HMPPS Auth's firewall sometimes rejects a service's token
 * request (406), seemingly when the random auth code contains "--", leaving
 * the browser on the service's error page at /sign-in/callback. Going back to
 * the page gets a new code.
 */
export async function retryFailedSignIn(
  page: Page,
  target: string,
): Promise<void> {
  const authHost = new URL(env.authUrl()).host;
  for (let attempt = 1; ; attempt++) {
    await page.waitForURL((url) => url.host !== authHost);
    const failed = new URL(page.url()).pathname.endsWith("/sign-in/callback");
    if (!failed || attempt === SIGN_IN_ATTEMPTS) return;
    await page.goto(target);
  }
}
