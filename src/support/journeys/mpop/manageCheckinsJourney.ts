import { expect, Page, test } from "@playwright/test";
import {
  ContactDetails,
  Preference,
} from "../../pages/mpop/contactPreferencePage";
import { loginToMpop } from "../../pages/mpop/loginPage";
import { MpopPages } from "../../pages/mpop/mpopPages";
import ManageCheckInsPage from "../../pages/mpop/manageCheckInsPage";
import { FrequencyOptions } from "../../pages/mpop/dateFrequencyPage";
import { ManageCheckinsUiPages } from "../../pages/manage-checkins-ui/manageCheckinsUiPages";
import { assertOnExpectedUi, ExpectedUi } from "../../utils/expectedUi";
import { assertCaseBanner } from "../../utils/caseBanner";
import { assertManageOnlineCheckinsUiTitle } from "../../utils/pageTitle";
import {
  CONTACT_PREFERENCE_TITLE,
  EDIT_CONTACT_DETAILS_TITLE,
  STOP_CHECKINS_TITLE,
} from "../../../data/manage-checkins-ui/pageTitles";

export interface RestartValues {
  date: string;
  frequency: FrequencyOptions;
  preference: Preference;
  contact?: ContactDetails;
}

export default class ManageCheckInsJourney {
  private readonly pages: MpopPages;
  private readonly newUiPages: ManageCheckinsUiPages;

  constructor(private readonly page: Page) {
    this.pages = new MpopPages(page);
    this.newUiPages = new ManageCheckinsUiPages(page);
  }

  async login(): Promise<void> {
    await test.step("Log in to MPOP as practitioner", async () => {
      await loginToMpop(this.page);
    });
  }

  async openManage(crn: string): Promise<ManageCheckInsPage> {
    await test.step(`Open online check ins for ${crn}`, async () => {
      await this.pages.overview.goTo(crn);
      await this.pages.overview.assertOnPage();
      await this.pages.overview.clickViewAllOnlineCheckinDetails();
      await this.pages.manage.assertOnPage();
    });
    return this.pages.manage;
  }

 
  async stopCheckIns(
    crn: string,
    reason: string,
    expectedUi?: ExpectedUi,
  ): Promise<void> {
    await test.step(`Stop online check ins for ${crn}`, async () => {
      const manage = await this.openManage(crn);
      await manage.clickStopCheckIns();

      const onNewUi = assertOnExpectedUi(
        this.page,
        "Stop check ins",
        expectedUi,
      );

      await this.pages.stop.assertOnPage();
      if (onNewUi) {
        await assertManageOnlineCheckinsUiTitle(this.page, STOP_CHECKINS_TITLE);
        await assertCaseBanner(this.page, crn);
      }
      await this.pages.stop.completePage(reason);
    });
  }

  async changeContactDetails(
    crn: string,
    opts: {
      preference?: Preference;
      contact?: ContactDetails;
      expectedUi?: ExpectedUi;
    },
  ): Promise<void> {
    await test.step(`Change contact details for ${crn}`, async () => {
      const manage = await this.openManage(crn);
      await expect(
        manage.changeContactDetailsLink(),
        "Change contact details link should be present for an active check in",
      ).toBeVisible();
      await manage.clickChangeContactDetails();

      const onNewUi = assertOnExpectedUi(
        this.page,
        "Change contact details",
        opts.expectedUi,
      );

      if (onNewUi) {
        if (opts.preference === undefined) {
          throw new Error(
            "manage-checkins-ui requires a preference to be selected when changing contact details",
          );
        }
        await assertCaseBanner(this.page, crn);
        const contactDetails = this.newUiPages.contactDetails;
        await expect(contactDetails.preferenceGroup()).toBeVisible();
        await assertManageOnlineCheckinsUiTitle(
          this.page,
          CONTACT_PREFERENCE_TITLE,
        );

        const value =
          opts.preference === Preference.EMAIL
            ? opts.contact?.email
            : opts.contact?.mobile;
        if (value !== undefined) {
          const changeButton =
            opts.preference === Preference.EMAIL
              ? contactDetails.changeEmailAddressButton()
              : contactDetails.changeMobileNumberButton();
          await changeButton.click();
          const editContactDetails = this.newUiPages.editContactDetails;
          const field =
            opts.preference === Preference.EMAIL
              ? editContactDetails.emailAddressField()
              : editContactDetails.mobileNumberField();
          await assertManageOnlineCheckinsUiTitle(
            this.page,
            EDIT_CONTACT_DETAILS_TITLE,
          );
          await assertCaseBanner(this.page, crn);
          await field.fill(value);
          await editContactDetails.save();
          await expect(contactDetails.preferenceGroup()).toBeVisible();
        }

        await contactDetails.selectPreference(opts.preference);
        await contactDetails.save();
      } else {
        // Legacy MPOP path - delete this branch once change-contact-details
        // is on manage-checkins-ui everywhere.
        await this.pages.contactPreference.assertOnPage();
        await this.pages.contactPreference.changePage(
          opts.preference,
          opts.contact,
        );
      }
    });
  }

  async changeCheckInSettings(
    crn: string,
    values: { date?: string; frequency?: FrequencyOptions },
  ): Promise<void> {
    await test.step(`Change check in settings for ${crn}`, async () => {
      const manage = await this.openManage(crn);
      await expect(
        manage.changeCheckinSettingsLink(),
        "Change check in settings link should be present for an active check in",
      ).toBeVisible();
      await manage.clickChangeCheckinSettings();
      await this.pages.changeCheckinSettings.assertOnPage();
      await this.pages.changeCheckinSettings.changePage(
        values.date,
        values.frequency,
      );
    });
  }

  async restartCheckIns(crn: string, values: RestartValues): Promise<void> {
    await test.step(`Restart online check ins for ${crn}`, async () => {
      const manage = await this.openManage(crn);
      await manage.clickRestartCheckIns();
      await this.pages.restartDateFrequency.assertOnPage();
      await this.pages.restartDateFrequency.completePage(
        values.date,
        values.frequency,
      );
      await this.pages.restartContactPreference.assertOnPage();
      await this.pages.restartContactPreference.completePage(
        values.preference,
        values.contact,
      );
      await this.pages.restartSummary.assertOnPage();
      await this.pages.restartSummary.submitSetUp();
      await this.pages.restartConfirmation.assertOnPage();
    });
  }
}
