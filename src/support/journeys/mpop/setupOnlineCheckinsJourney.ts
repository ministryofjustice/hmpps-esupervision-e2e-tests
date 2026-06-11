import { Page } from "playwright-core";
import CheckInSummaryPage from "../../pages/mpop/checkInSummaryPage";
import { Preference } from "../../pages/mpop/contactPreferencePage";
import { FrequencyOptions } from "../../pages/mpop/dateFrequencyPage";
import { loginToMpop } from "../../pages/mpop/loginPage";
import { PhotoOptions } from "../../pages/mpop/photoOptionsPage";
import { ContactDetails } from "../../pages/mpop/updateContactDetailsPage";
import { MpopPages } from "../../pages/mpop/mpopPages";
import test from "@playwright/test";

interface SetupValues {
  date: string;
  frequency: FrequencyOptions;
  preference: Preference;
  contact?: ContactDetails;
  photo: PhotoOptions;
  eligibilityIds: number[];
}
export default class SetupOnlineCheckinsJourney {
  private readonly pages: MpopPages;

  constructor(private readonly page: Page) {
    this.pages = new MpopPages(page);
  }
  async login(): Promise<void> {
    await test.step("Log in to MPOP as practitioner", async () => {
      await loginToMpop(this.page);
    });
  }

  async startSetup(crn: string): Promise<void> {
    await test.step(`Open setup online check ins for ${crn}`, async () => {
      await this.pages.overview.goTo(crn);
      await this.pages.overview.assertOnPage();
      await this.pages.overview.clickSetupOnlineCheckIns();
    });
  }
  async completeSetupToSummary(
    setup: SetupValues,
  ): Promise<CheckInSummaryPage> {
    return test.step("Compete set up online check ins", async () => {
      await this.pages.eligibility.assertOnPage;
      await this.pages.eligibility.completePage(setup.eligibilityIds);

      await this.pages.eligible.assertOnPage;
      await this.pages.eligible.completePage(0);

      await this.pages.spoApproval.assertOnPage;
      await this.pages.spoApproval.completePage();

      await this.pages.dateFrequency.assertOnPage;
      await this.pages.dateFrequency.completePage(setup.date, setup.frequency);

      await this.pages.contactPreference.assertOnPage;
      await this.pages.contactPreference.completePage(
        setup.preference,
        setup.contact,
      );

      await this.pages.photoOptions.assertOnPage;
      await this.pages.photoOptions.completePage(setup.photo);

      if (setup.photo === PhotoOptions.UPLOAD) {
        await this.pages.uploadPhoto.assertOnPage;
        await this.pages.uploadPhoto.completePage();
      } else {
        await this.pages.takePhoto.assertOnPage;
        await this.pages.takePhoto.completePage();
      }
      await this.pages.photoMeetRules.assertOnPage;
      await this.pages.photoMeetRules.completePage();

      await this.pages.summary.assertOnPage;
      return this.pages.summary;
    });
  }
}
