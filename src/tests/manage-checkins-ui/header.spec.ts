import test, { expect, Page } from "@playwright/test";
import SignInJourney from "../../support/journeys/manage-checkins-ui/signInJourney";
import { ManageCheckinsUiPages } from "../../support/pages/manage-checkins-ui/manageCheckinsUiPages";

test.describe("manage online check ins UI header", () => {
  let page: Page;
  let pages: ManageCheckinsUiPages;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    pages = await new SignInJourney(page).login();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("header is shown with a sign out link", async () => {
    await expect(pages.header.header()).toBeVisible();
    await expect(pages.header.signOutLink().first()).toHaveAttribute(
      "href",
      /sign-out/,
    );
  });

  test("header shows the signed in practitioner's name", async () => {
    // Displayed as "Initial. Surname" (e.g. "A. Account") - Delius doesn't
    // expose this display format via env config, so check the shape rather
    // than an exact match.
    await expect(pages.header.userName()).toHaveText(/^[A-Z]\. \S+$/);
  });
});
