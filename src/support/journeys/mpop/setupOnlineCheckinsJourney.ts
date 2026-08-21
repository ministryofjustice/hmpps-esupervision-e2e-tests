import { expect, Page } from "@playwright/test";
import CheckInSummaryPage from "../../pages/mpop/checkInSummaryPage";
import { Preference } from "../../pages/mpop/contactPreferencePage";
import { FrequencyOptions } from "../../pages/mpop/dateFrequencyPage";
import { loginToMpop } from "../../pages/mpop/loginPage";
import { PhotoOptions } from "../../pages/mpop/photoOptionsPage";
import { ContactDetails } from "../../pages/mpop/updateContactDetailsPage";
import { MpopPages } from "../../pages/mpop/mpopPages";
import test from "@playwright/test";
import CheckInConfirmationPage from "../../pages/mpop/checkInConfirmationPage";
import { ManageCheckinsUiPages } from "../../pages/manage-checkins-ui/manageCheckinsUiPages";
import { assertOnExpectedUi, ExpectedUi } from "../../utils/expectedUi";
import { assertCaseBanner } from "../../utils/caseBanner";
import { assertManageOnlineCheckinsUiTitle } from "../../utils/pageTitle";
import {
  CONTACT_PREFERENCE_TITLE,
  EDIT_CONTACT_DETAILS_TITLE,
} from "../../../data/manage-checkins-ui/pageTitles";

export type { ExpectedUi };

interface ContactPreferenceValues {
  preference: Preference;
  contact?: ContactDetails;
  expectedUi?: ExpectedUi;
}

interface SetupValues extends ContactPreferenceValues {
  date: string;
  frequency: FrequencyOptions;
  photo: PhotoOptions;
  eligibilityIds: number[];
  rationale: string;
}
export default class SetupOnlineCheckinsJourney {
  private readonly pages: MpopPages;
  private readonly newUiPages: ManageCheckinsUiPages;

  constructor(private readonly page: Page) {
    this.pages = new MpopPages(page);
    this.newUiPages = new ManageCheckinsUiPages(page);
  }

  private async completeContactPreference(
    crn: string,
    setup: ContactPreferenceValues,
  ): Promise<void> {
    const onNewUi = assertOnExpectedUi(
      this.page,
      "Contact preference",
      setup.expectedUi,
    );

    if (onNewUi) {
      await assertCaseBanner(this.page, crn);
      const contactPreference = this.newUiPages.contactPreference;
      await expect(contactPreference.preferenceGroup()).toBeVisible();
      await assertManageOnlineCheckinsUiTitle(
        this.page,
        CONTACT_PREFERENCE_TITLE,
      );
      await contactPreference.selectPreferenceAndContinue(setup.preference);

      // The next screen is either "confirm the detail on file" or, if NDelius has no
      // matching detail yet, "enter the missing detail" - wait for whichever appears.
      await expect(
        contactPreference
          .confirmDetailsGroup()
          .or(contactPreference.missingDetailsField()),
      ).toBeVisible();

      if (await contactPreference.missingDetailsField().isVisible()) {
        await assertManageOnlineCheckinsUiTitle(
          this.page,
          EDIT_CONTACT_DETAILS_TITLE,
        );
        await assertCaseBanner(this.page, crn);
        const value =
          setup.preference === Preference.EMAIL
            ? setup.contact?.email
            : setup.contact?.mobile;
        if (value === undefined) {
          throw new Error(
            "manage-checkins-ui asked for a missing contact detail but setup.contact has none for the chosen preference",
          );
        }
        await contactPreference.enterMissingDetailsAndContinue(value);
      } else {
        await contactPreference.confirmDetailsAndContinue();
      }
    } else {
      await this.pages.contactPreference.assertOnPage();
      await this.pages.contactPreference.completePage(
        setup.preference,
        setup.contact,
      );
    }
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

  async completePhotoSteps(photo: PhotoOptions): Promise<void> {
    await this.pages.photoOptions.assertOnPage();
    await this.pages.photoOptions.completePage(photo);

    if (photo === PhotoOptions.UPLOAD) {
      await this.pages.uploadPhoto.assertOnPage();
      await this.pages.uploadPhoto.completePage();
    } else {
      await this.pages.takePhoto.assertOnPage();
      await this.pages.takePhoto.completePage();
    }
    await this.pages.photoMeetRules.assertOnPage();
    await this.pages.photoMeetRules.completePage();
  }
  async completeSetupToSummary(
    crn: string,
    setup: SetupValues,
  ): Promise<CheckInSummaryPage> {
    return test.step("Complete set up online check ins", async () => {
      await this.pages.eligibility.assertOnPage();
      await this.pages.eligibility.completePage(setup.eligibilityIds);

      await this.pages.eligible.assertOnPage();
      await this.pages.eligible.completePage(0);

      await this.pages.spoApproval.assertOnPage();
      await this.pages.spoApproval.completePage();

      await this.pages.rationale.assertOnPage();
      await this.pages.rationale.completePage(setup.rationale);

      await this.pages.dateFrequency.assertOnPage();
      await this.pages.dateFrequency.completePage(setup.date, setup.frequency);

      await this.completeContactPreference(crn, setup);

      await this.completePhotoSteps(setup.photo);
      await this.pages.summary.assertOnPage();
      return this.pages.summary;
    });
  }

  async submitSetup(summary: CheckInSummaryPage): Promise<void> {
    await summary.submitSetUp();
    await new CheckInConfirmationPage(this.page).assertOnPage();
  }

  async changePhotoSummary(
    summary: CheckInSummaryPage,
    photo: PhotoOptions,
  ): Promise<void> {
    await summary.clickChange("photo");
    await this.completePhotoSteps(photo);
    await summary.assertOnPage();
  }

  async changeContactPreferenceFromSummary(
    crn: string,
    summary: CheckInSummaryPage,
    opts: {
      preference?: Preference;
      contact?: ContactDetails;
      expectedUi?: ExpectedUi;
    },
  ): Promise<void> {
    await summary.clickChange("contactPreference");

    const onNewUi = assertOnExpectedUi(
      this.page,
      "Contact preference",
      opts.expectedUi,
    );

    if (onNewUi) {
      if (opts.preference === undefined) {
        throw new Error(
          "manage-checkins-ui requires a preference to be selected when changing contact preference from the summary",
        );
      }
      await this.completeContactPreference(crn, {
        preference: opts.preference,
        contact: opts.contact,
      });
    } else {
      await this.pages.contactPreference.assertOnPage();
      await this.pages.contactPreference.changePage(
        opts.preference,
        opts.contact,
      );
    }
    await summary.assertOnPage();
  }

  async changeDateFrequencyFromSummary(
    summary: CheckInSummaryPage,
    opts: { date?: string; frequency?: FrequencyOptions },
  ): Promise<void> {
    if (opts.date === undefined && opts.frequency === undefined) {
      throw new Error(
        "changeDateFrequencyFromSummary requires at least one of date or frequency",
      );
    }
    await summary.clickChange(opts.date !== undefined ? "date" : "frequency");
    await this.pages.dateFrequency.assertOnPage();
    await this.pages.dateFrequency.changePage(opts.date, opts.frequency);
    await summary.assertOnPage();
  }
}
