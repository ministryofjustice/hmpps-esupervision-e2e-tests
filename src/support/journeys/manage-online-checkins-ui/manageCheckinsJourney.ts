import { expect, Page, test } from "@playwright/test";
import { loginToMpop } from "../../pages/mpop/loginPage";
import { ManageCheckinsPages } from "../../pages/manage-online-checkins-ui/manageCheckinsPages";
import ManageCheckInsPage from "../../pages/manage-online-checkins-ui/manageCheckInsPage";
import { FrequencyOptions } from "../../pages/manage-online-checkins-ui/checkInFrequencyPage";
import {
  CONTACT_PREFERENCE_TITLE,
  EDIT_CONTACT_DETAILS_TITLE,
  STOP_CHECKINS_TITLE,
} from "../../../data/manage-online-checkins-ui/pageTitles";
import { Preference, ContactDetails } from "../../../data/models";
import {
  assertCaseBanner,
  assertManageCheckinsPage,
} from "../../assertions/manage-online-checkins-ui/manageCheckinsAssertions";
import {
  assertAbsoluteMpopHref,
  assertRelativeHref,
  followToMpop,
  MPOP_PATH,
} from "../../assertions/manage-online-checkins-ui/mpopHandoff";
import { offenderUuidFrom } from "../../utils/url";

export interface RestartValues {
  date?: string;
  frequency: FrequencyOptions;
  preference: Preference;
  contact?: ContactDetails;
}

export default class ManageCheckInsJourney {
  private readonly pages: ManageCheckinsPages;

  constructor(private readonly page: Page) {
    this.pages = new ManageCheckinsPages(page);
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
      await this.pages.overview.clickManageOnlineCheckIns();
      await this.pages.manage.assertOnPage();
    });
    return this.pages.manage;
  }

  /** The manage page's Back link points at the person's overview. */
  async assertManageBackLink(crn: string): Promise<void> {
    await assertRelativeHref(
      this.pages.manage.backLink(),
      "Back on the manage check ins page",
      MPOP_PATH.overview(crn),
    );
  }

  /** Clicks Stop check ins from the manage page and waits for the stop page. */
  async goToStopCheckIns(crn: string): Promise<void> {
    await this.pages.manage.clickStopCheckIns();
    await this.pages.stop.assertOnPage();
    await assertManageCheckinsPage(this.page, crn, STOP_CHECKINS_TITLE);
  }

  async openStopCheckIns(crn: string): Promise<void> {
    await test.step(`Open stop check ins for ${crn}`, async () => {
      await this.openManage(crn);
      await this.goToStopCheckIns(crn);
    });
  }

  /** Back and Cancel on the stop page both return to the manage page, going out
   *  through MPOP to get there. Leaves you on the manage page. */
  async assertStopPageLinks(crn: string): Promise<void> {
    // The exact manage page, uuid and all. A prefix of manage/ would also match
    // the stop page's own URL, which sits under it.
    const backToManage = MPOP_PATH.manageCheckin(
      crn,
      offenderUuidFrom(this.page.url()),
    );

    await test.step("Back returns to the manage page via MPOP", async () => {
      await assertAbsoluteMpopHref(
        this.pages.stop.backLink(),
        "Back on the stop check ins page",
        backToManage,
      );
      await this.pages.stop.backLink().click();
      await this.pages.manage.assertOnPage();
    });

    // Back left us on the manage page - go back to the stop page for Cancel.
    // Outside the steps, so a failure here isn't reported against either link.
    await this.goToStopCheckIns(crn);

    await test.step("Cancel returns to the manage page via MPOP", async () => {
      await assertAbsoluteMpopHref(
        this.pages.stop.cancelLink(),
        "Cancel on the stop check ins page",
        backToManage,
      );
      await this.pages.stop.cancelLink().click();
      await this.pages.manage.assertOnPage();
    });
  }

  async stopCheckIns(crn: string, reason: string): Promise<void> {
    await test.step(`Stop online check ins for ${crn}`, async () => {
      await this.openStopCheckIns(crn);
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

      const contactDetails = this.pages.contactDetails;
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
        const editContactDetails = this.pages.editContactDetails;
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

      // The caller navigates away next. A click resolves when it is dispatched,
      // not when the POST lands, so wait for the form to go before leaving.
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
      if (values.frequency !== undefined) {
        const manage = await this.openManage(crn);
        await manage.clickChangeFrequency();

        await this.pages.checkinFrequency.assertOnPage();
        await assertCaseBanner(this.page, crn);
        await this.pages.checkinFrequency.completePage(values.frequency);
        await this.pages.manage.assertOnPage();
      }
      if (values.date !== undefined) {
        const manage = await this.openManage(crn);
        await manage.clickChangeNextCheckinDate();
        await this.pages.checkinDate.assertOnPage();
        await assertCaseBanner(this.page, crn);
        await this.pages.checkinDate.completePage(values.date);
        await this.pages.manage.assertOnPage();
      }
    });
  }

  async restartCheckIns(crn: string, values: RestartValues): Promise<void> {
    const isAdHoc = values.frequency === FrequencyOptions.AD_HOC;
    if (!isAdHoc && !values.date?.trim()) {
      throw new Error("Date is required for recurring check ins");
    }
    await test.step(`Restart online check ins for ${crn}`, async () => {
      const manage = await this.openManage(crn);
      await manage.clickRestartCheckIns();
      await this.pages.checkinFrequency.assertOnPage();
      await this.pages.checkinFrequency.completePage(values.frequency);
      if (!isAdHoc) {
        await this.pages.checkinDate.assertOnPage();
        await this.pages.checkinDate.completePage(values.date);
      }
      await this.pages.restartContactPreference.assertOnPage();
      await expect(
        this.pages.restartContactPreference.backLink(),
        "Back on the restart contact page go to previous page",
      ).toHaveAttribute(
        "href",
        isAdHoc ? /\/restart-checkin$/ : /\/restart-checkin-date$/,
      );
      await this.pages.restartContactPreference.completePage(
        values.preference,
        values.contact,
      );
      await this.pages.restartSummary.assertOnPage();
      await this.pages.restartSummary.submitSetUp();
      await this.pages.restartConfirmation.assertOnPage();
    });
  }

  /**
   * The restart confirmation's two links back to MPOP: check the all cases href,
   * then follow the overview link.
   *
   * Kept out of restartCheckIns so a link change fails a link test, not
   * whatever else happened to restart check ins. The page only exists just
   * after restarting, so call this straight afterwards. It navigates away, so
   * call it last.
   */
  async assertRestartConfirmationLinksLandInMpop(crn: string): Promise<void> {
    await test.step("Restart confirmation links hand off to MPOP", async () => {
      // Check the href first - the click below leaves this page.
      await assertAbsoluteMpopHref(
        this.pages.restartConfirmation.allCasesLink(),
        "Go to all cases",
        MPOP_PATH.allCases,
      );
      await followToMpop(
        this.page,
        this.pages.restartConfirmation.overviewLink(),
        "Return to the person's overview",
        MPOP_PATH.overview(crn),
        () => this.pages.overview.assertOnPage(),
      );
    });
  }
}
