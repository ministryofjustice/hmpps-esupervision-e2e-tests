import test, { expect } from "@playwright/test";
import SetupOnlineCheckinsJourney from "../../support/journeys/mpop/setupOnlineCheckinsJourney";
import { Preference } from "../../support/pages/mpop/contactPreferencePage";
import { FrequencyOptions } from "../../support/pages/mpop/dateFrequencyPage";
import { PhotoOptions } from "../../support/pages/mpop/photoOptionsPage";
import { firstCheckinDateString } from "../../support/utils/date";
import { env } from "../../config/env";
import { TEST_CONTACT } from "../../data/mpop/testData";

test("practitioner sets up online check ins for an offender", async ({
  page,
}) => {
  const crn = env.mpopTestCrn();
  const firstCheckin = firstCheckinDateString();
  const journey = new SetupOnlineCheckinsJourney(page);
  await journey.login();
  await journey.startSetup(crn);

  const summary = await journey.completeSetupToSummary({
    date: firstCheckinDateString(7),
    frequency: FrequencyOptions.EVERY_WEEK,
    preference: Preference.EMAIL,
    contact: { mobile: TEST_CONTACT.mobile, email: TEST_CONTACT.email },
    photo: PhotoOptions.UPLOAD,
    eligibilityIds: [9],
  });

  await test.step("Summary reflects the answers entered", async () => {
    await expect(summary.summaryValueLocator("date")).toContainText(
      firstCheckin,
    );
    await expect(summary.summaryValueLocator("frequency")).toContainText(
      "Every week",
    );
    await expect(
      summary.summaryValueLocator("contactPreference"),
    ).toContainText("Email");
    await expect(summary.summaryValueLocator("mobile")).toContainText(
      TEST_CONTACT.mobile,
    );
    await expect(summary.summaryValueLocator("email")).toContainText(
      TEST_CONTACT.email,
    );
    await expect(
      summary.summaryValueLocator("photo").locator("img"),
    ).toBeVisible();
  });
});
