import { expect, Page, test } from "@playwright/test";
import { loginToMpop } from "../../pages/mpop/loginPage";
import { MpopPages } from "../../pages/mpop/mpopPages";
import ManageCheckInsPage from "../../pages/mpop/manageCheckInsPage";
import { FrequencyOptions } from "../../pages/mpop/dateFrequencyPage";
import { ManageCheckinsUiPages } from "../../pages/manage-checkins-ui/manageCheckinsUiPages";
import { assertExpectedService } from "../../utils/legacyMpop";
import {
  CHECKIN_SETTINGS_TITLE,
  CONTACT_PREFERENCE_TITLE,
  EDIT_CONTACT_DETAILS_TITLE,
  STOP_CHECKINS_TITLE,
} from "../../../data/manage-checkins-ui/pageTitles";
import { Preference, ContactDetails } from "../../../data/models";
import { assertManageCheckinsPage } from "../../assertions/manage-checkins-ui/manageCheckinsAssertions";
import {
  assertHrefIs,
  assertHrefIsMpop,
  assertLandsInMpop,
} from "../../assertions/manage-checkins-ui/mpopHandoffAssertions";

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
      // Checks the manage page's Back link href.
      await assertHrefIs(
        this.pages.manage.backLink(),
        "Back on the manage check ins page",
        `/case/${crn}`,
      );
    });
    return this.pages.manage;
  }

  /** Clicks Back on the manage page and checks it lands on the overview in MPOP. */
  async returnToOverview(crn: string): Promise<void> {
    await test.step(`Back from manage check ins returns to ${crn} in MPOP`, async () => {
      await assertLandsInMpop(
        this.page,
        this.pages.manage.backLink(),
        "Back on the manage check ins page",
        `/case/${crn}`,
        () => this.pages.overview.assertOnPage(),
      );
    });
  }

  async stopCheckIns(crn: string, reason: string): Promise<void> {
    await test.step(`Stop online check ins for ${crn}`, async () => {
      const manage = await this.openManage(crn);
      await manage.clickStopCheckIns();
      await assertExpectedService(this.page, "Stop check ins");

      await this.pages.stop.assertOnPage();
      await assertManageCheckinsPage(this.page, crn, STOP_CHECKINS_TITLE);

      // Checks Back and Cancel each return to the manage page via MPOP. Followed
      // one at a time, since clicking one leaves the page the other is on.
      //
      // Not assertLandsInMpop: the href is MPOP's, but MPOP's manage route is
      // flagged over to this service, so the trip is MOCI -> MPOP -> back here.
      // Expecting to stop at MPOP would fail whenever the flag is on.
      const backToManage = `/case/${crn}/appointments/check-in/manage/`;

      await test.step("Back returns to the manage page via MPOP", async () => {
        await assertHrefIsMpop(
          this.pages.stop.backLink(),
          "Back",
          backToManage,
        );
        await this.pages.stop.backLink().click();
        await assertExpectedService(this.page, "Back from stop check ins");
        await this.pages.manage.assertOnPage();
        await this.pages.manage.clickStopCheckIns();
        await this.pages.stop.assertOnPage();
      });

      await test.step("Cancel returns to the manage page via MPOP", async () => {
        await assertHrefIsMpop(
          this.pages.stop.cancelLink(),
          "Cancel",
          backToManage,
        );
        await this.pages.stop.cancelLink().click();
        await assertExpectedService(this.page, "Cancel from stop check ins");
        await this.pages.manage.assertOnPage();
        await this.pages.manage.clickStopCheckIns();
        await this.pages.stop.assertOnPage();
      });

      await this.pages.stop.completePage(reason);
    });
  }

  async changeContactDetails(
    crn: string,
    opts: {
      preference: Preference;
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

      const contactDetails = this.manageCheckinsPages.contactDetails;
      await expect(contactDetails.preferenceGroup()).toBeVisible();
      await assertManageCheckinsPage(this.page, crn, CONTACT_PREFERENCE_TITLE);

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
        await assertManageCheckinsPage(
          this.page,
          crn,
          EDIT_CONTACT_DETAILS_TITLE,
        );
        await field.fill(value);
        await editContactDetails.save();
        await expect(contactDetails.preferenceGroup()).toBeVisible();
      }

      await contactDetails.selectPreference(opts.preference);
      await contactDetails.save();

      // The caller navigates away next. A click resolves when it is dispatched, not
      // when the POST lands, so wait for the form to go before leaving the page.
      await expect(
        contactDetails.saveChangesButton(),
        "Saving contact details should leave the page, not re-render it with errors",
      ).toBeHidden();
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
      await assertExpectedService(this.page, "Change check in settings");
      await this.pages.changeCheckinSettings.assertOnPage();
      await assertManageCheckinsPage(this.page, crn, CHECKIN_SETTINGS_TITLE);
      await this.pages.changeCheckinSettings.changePage(
        values.date,
        values.frequency,
      );
      await this.pages.manage.assertOnPage();
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

      // Checks the all cases link's href, then follows the overview link to MPOP.
      await test.step("Restart confirmation links hand off to MPOP", async () => {
        await assertHrefIs(
          this.pages.restartConfirmation.allCasesLink(),
          "Go to all cases",
          "/case/",
        );
        await assertLandsInMpop(
          this.page,
          this.pages.restartConfirmation.overviewLink(),
          "Return to the person's overview",
          `/case/${crn}`,
          () => this.pages.overview.assertOnPage(),
        );
      });
    });
  }
}
