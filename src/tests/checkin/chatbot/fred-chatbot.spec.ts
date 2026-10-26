import test, { expect } from "@playwright/test";
import { Pages } from "../../../support/pages/checkins-ui/Pages";

test("Fred chatbot is displayed and opens on the start page", async ({
  page,
}) => {
  const pages = new Pages(page);
  await page.goto("/");

  await test.step("Chatbot button is displayed", async () => {
    await expect(pages.chatbot.launcherButton()).toBeVisible();
  });

  await test.step("Chatbot opens when the button is clicked", async () => {
    await pages.chatbot.open();
    await expect(pages.chatbot.closeButton()).toBeVisible();
  });
});
