import { test, expect, Page } from "@playwright/test";
import { env } from "../../../config/env";
import { ManageCheckinsUiPages } from "../../pages/manage-checkins-ui/manageCheckinsUiPages";
import { clearSecretField } from "../../utils/clearSecretField";

export default class SignInJourney {
  readonly pages: ManageCheckinsUiPages;

  constructor(private readonly page: Page) {
    this.pages = new ManageCheckinsUiPages(page);
  }

  async login(): Promise<ManageCheckinsUiPages> {
    await test.step("Sign in to the manage online check ins UI", async () => {
      await this.page.goto(env.manageCheckinsUiUrl());
      await expect(this.page).toHaveTitle(/HMPPS Digital Services - Sign in/);
      const username = env.deliusUsername();
      const password = env.deliusPassword();
      await this.page.fill("#username", username);
      await this.page.fill("#password", password);
      await this.page.click("#submit");
      await clearSecretField(this.page, "#password");
      await expect(this.pages.header.userName()).toBeVisible();
    });
    return this.pages;
  }
}
