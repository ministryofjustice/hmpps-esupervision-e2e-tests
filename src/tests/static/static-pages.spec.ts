import { test, expect } from "@playwright/test";

const staticPages = [
  { path: "/accessibility", heading: "Accessibility statement" },
  {
    path: "/guidance",
    heading: "About the Check in with your probation officer service",
  },
  { path: "/cookies", heading: "Cookies" },
  { path: "/privacy-notice", heading: "Privacy Notice" },
];

for (const { path, heading } of staticPages) {
  test(`static page ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      heading,
    );
  });
}
