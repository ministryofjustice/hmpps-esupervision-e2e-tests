import { test as setup } from "@playwright/test";
import DashboardJourney from "../../support/journeys/dashboard/dashboardJourney";

setup("authenticate", async ({ page }) => {
  await new DashboardJourney(page).signIn();
});
