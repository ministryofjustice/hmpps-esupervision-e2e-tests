import { test, expect, Page } from "@playwright/test";
import { env } from "../../../config/env";
import { ManageCheckinsUiPages } from "../../pages/manage-checkins-ui/manageCheckinsUiPages";

export default class SignInJourney {
  readonly pages: ManageCheckinsUiPages;

  constructor(private readonly page: Page) {
    this.pages = new ManageCheckinsUiPages(page);
  }

  async login(path: string): Promise<ManageCheckinsUiPages> {
    const target = `${env.manageCheckinsUiUrl().replace(/\/$/, "")}${path}`;

    await test.step("Sign in to the manage online check ins UI", async () => {
      await this.page.goto(target);
      await expect(this.page).toHaveTitle(/HMPPS Digital Services - Sign in/);
      const username = env.deliusUsername();
      const password = env.deliusPassword();
      await this.page.fill("#username", username);
      await this.page.fill("#password", password);
      await this.page.click("#submit");
      await expect(this.pages.header.userName()).toBeVisible();
    });
    return this.pages;
  }
}
