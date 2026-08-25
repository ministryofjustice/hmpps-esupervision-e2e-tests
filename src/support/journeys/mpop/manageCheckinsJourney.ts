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
import {
  assertExpectedService,
  assertManageCheckinsPage,
} from "../../utils/legacyMpop";
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
  private readonly manageCheckinsPages: ManageCheckinsUiPages;

  constructor(private readonly page: Page) {
    this.pages = new MpopPages(page);
    this.manageCheckinsPages = new ManageCheckinsUiPages(page);
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
      // The manage page is itself behind a flag, so assert before anything reached
      // from it.
      await assertExpectedService(this.page, "Manage check ins page");
      await this.pages.manage.assertOnPage();
    });
    return this.pages.manage;
  }

  async stopCheckIns(crn: string, reason: string): Promise<void> {
    await test.step(`Stop online check ins for ${crn}`, async () => {
      const manage = await this.openManage(crn);
      await manage.clickStopCheckIns();
      await assertExpectedService(this.page, "Stop check ins");

      await this.pages.stop.assertOnPage();
      await assertManageCheckinsPage(this.page, crn, STOP_CHECKINS_TITLE);
      await this.pages.stop.completePage(reason);
    });
  }

  async changeContactDetails(
    crn: string,
    opts: {
      preference?: Preference;
      contact?: ContactDetails;
    },
  ): Promise<void> {
    await test.step(`Change contact details for ${crn}`, async () => {
      const manage = await this.openManage(crn);
      await expect(
        manage.changeContactDetailsLink(),
        "Change contact details link should be present for an active check in",
      ).toBeVisible();
      await manage.clickChangeContactDetails();
      await assertExpectedService(this.page, "Change contact details");

      // MOCI only - MPOP has no equivalent page, case banner, or edit page here.
      // Callers should skip this test under LEGACY_MPOP instead of branching.
      if (opts.preference === undefined) {
        throw new Error(
          "changeContactDetails requires a preference to be selected",
        );
      }
      await assertCaseBanner(this.page, crn);
      const contactDetails = this.manageCheckinsPages.contactDetails;
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
        const editContactDetails = this.manageCheckinsPages.editContactDetails;
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
      await assertExpectedService(this.page, "Restart check ins");
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
