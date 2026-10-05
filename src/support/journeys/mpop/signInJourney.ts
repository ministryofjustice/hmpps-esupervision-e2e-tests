import { test, expect, Page } from "@playwright/test";
import { env } from "../../../config/env";
import SignInPage from "../../pages/base/signInPage";
import { ManageCheckinsPages } from "../../pages/manage-online-checkins-ui/manageCheckinsPages";

export default class SignInJourney {
  readonly pages: ManageCheckinsPages;

  constructor(private readonly page: Page) {
    this.pages = new ManageCheckinsPages(page);
  }

  async login(path: string): Promise<ManageCheckinsPages> {
    const target = `${env.manageCheckinsUiUrl().replace(/\/$/, "")}${path}`;

    await test.step("Sign in to the manage online check ins UI", async () => {
      await this.page.goto(target);
      await new SignInPage(this.page).completeSignIn();
      await expect(this.pages.header.userName()).toBeVisible();
    });
    return this.pages;
  }
}
