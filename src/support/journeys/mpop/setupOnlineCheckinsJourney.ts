import { expect, Page } from "@playwright/test";
import CheckInSummaryPage from "../../pages/mpop/checkInSummaryPage";
import { Preference } from "../../pages/mpop/contactPreferencePage";
import DateFrequencyPage, {
  FrequencyOptions,
} from "../../pages/mpop/dateFrequencyPage";
import { loginToMpop } from "../../pages/mpop/loginPage";
import { PhotoOptions } from "../../pages/mpop/photoOptionsPage";
import { ContactDetails } from "../../pages/mpop/updateContactDetailsPage";
import { MpopPages } from "../../pages/mpop/mpopPages";
import test from "@playwright/test";
import CheckInConfirmationPage from "../../pages/mpop/checkInConfirmationPage";
import { ManageCheckinsUiPages } from "../../pages/manage-checkins-ui/manageCheckinsUiPages";
import {
  assertExpectedService,
  assertManageCheckinsPage,
  LEGACY_MPOP,
} from "../../utils/legacyMpop";
import { assertCaseBanner } from "../../utils/caseBanner";
import { assertManageOnlineCheckinsUiTitle } from "../../utils/pageTitle";
import {
  CONTACT_PREFERENCE_TITLE,
  EDIT_CONTACT_DETAILS_TITLE,
} from "../../../data/manage-checkins-ui/pageTitles";

interface ContactPreferenceValues {
  preference: Preference;
  /** The detail that should end up on file - entered, or replacing what is there. */
  contact?: ContactDetails;
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
  private readonly manageCheckinsPages: ManageCheckinsUiPages;
  private onFileContact?: string;

  constructor(private readonly page: Page) {
    this.pages = new MpopPages(page);
    this.manageCheckinsPages = new ManageCheckinsUiPages(page);
  }

  /**
   * The contact detail the wizard left on file - entered when NDelius held none,
   * confirmed when it did. Assert the summary against this rather than the value
   * the spec passed in, which the confirm route never uses.
   */
  contactOnFile(): string {
    if (this.onFileContact === undefined) {
      throw new Error(
        "contactOnFile() is only available once the contact preference step has run",
      );
    }
    return this.onFileContact;
  }

  /**
   * "Is this the right email address for X?" - MOCI only, and stays after MPOP
   * is removed.
   *
   * TODO(confirm-page-title): APP bug - this page currently shares its page
   * title with the preference page before it, so the caption and radios are what
   * prove we moved on instead. Once the title is fixed, assert on it directly
   * here and drop the caption/radio workaround.
   */
  private async assertOnConfirmContactPage(
    crn: string,
    preference: Preference,
  ): Promise<void> {
    const confirm = this.manageCheckinsPages.contactPreference;
    const detail =
      preference === Preference.EMAIL ? "email address" : "mobile number";

    // Checks the page title, but it's the one shared with the preference page
    // (see the TODO above), so it alone doesn't prove we're on the confirm page.
    await assertManageCheckinsPage(this.page, crn, CONTACT_PREFERENCE_TITLE);
    // The caption also holds "This information is saved in NDelius", so match
    // from the start rather than the whole text.
    await expect(
      confirm.confirmCaption(),
      `Should be confirming the person's ${detail}`,
    ).toContainText(new RegExp(`^\\s*Confirm .+'s ${detail}`));

    // The value is whatever NDelius holds, not something the test supplied, so
    // assert only that there is one - confirming a blank would be the failure.
    await expect(
      confirm.confirmedContactValue(),
      `Should show the ${detail} held in NDelius`,
    ).toHaveText(/\S/);

    await expect(
      confirm.confirmYesRadio(),
      "Should offer to confirm the detail as correct",
    ).toBeVisible();
    await expect(
      confirm.confirmChangeRadio(),
      `Should offer to change the ${detail}`,
    ).toBeVisible();
  }

  private async completeContactPreference(
    crn: string,
    setup: ContactPreferenceValues,
  ): Promise<void> {
    // TODO(legacy-mpop): Delete the else branch and unindent when legacy MPOP is
    // removed. MPOP collects contact details inline; MOCI confirms or edits them
    // on separate pages.
    if (!LEGACY_MPOP) {
      await assertCaseBanner(this.page, crn);
      const contactPreference = this.manageCheckinsPages.contactPreference;
      await expect(contactPreference.preferenceGroup()).toBeVisible();
      await assertManageOnlineCheckinsUiTitle(
        this.page,
        CONTACT_PREFERENCE_TITLE,
      );
      await contactPreference.selectPreferenceAndContinue(setup.preference);

      // Next is either "confirm the detail on file" or "enter the missing detail",
      // so wait for whichever appears.
      await expect(
        contactPreference
          .confirmDetailsGroup()
          .or(contactPreference.missingDetailsField()),
      ).toBeVisible();

      const value =
        setup.preference === Preference.EMAIL
          ? setup.contact?.email
          : setup.contact?.mobile;

      if (await contactPreference.missingDetailsField().isVisible()) {
        await assertManageCheckinsPage(
          this.page,
          crn,
          EDIT_CONTACT_DETAILS_TITLE,
        );
        if (value === undefined) {
          throw new Error(
            "manage-checkins-ui asked for a missing contact detail but setup.contact has none for the chosen preference",
          );
        }
        await contactPreference.enterMissingDetailsAndContinue(value);
        this.onFileContact = value;
      } else {
        await this.assertOnConfirmContactPage(crn, setup.preference);

        if (value === undefined) {
          // Nothing to change to, so confirm whatever this page is showing.
          this.onFileContact = (
            await contactPreference.confirmedContactValue().innerText()
          ).trim();
          await contactPreference.confirmDetailsAndContinue();
        } else {
          // A value for a detail already on file means replace it, so answer
          // "No, I need to change ..." and enter it on the edit page.
          await contactPreference.rejectDetailsAndContinue();
          await assertManageCheckinsPage(
            this.page,
            crn,
            EDIT_CONTACT_DETAILS_TITLE,
          );
          await expect(
            contactPreference.missingDetailsField(),
            "Answering No should lead to the edit contact details page",
          ).toBeVisible();
          await contactPreference.enterMissingDetailsAndContinue(value);
          this.onFileContact = value;
        }
      }
    } else {
      await this.pages.contactPreference.assertOnPage();
      await this.pages.contactPreference.completePage(
        setup.preference,
        setup.contact,
      );
      // MPOP collects the details inline, so what is on file is what we typed.
      this.onFileContact =
        setup.preference === Preference.EMAIL
          ? setup.contact?.email
          : setup.contact?.mobile;
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
      // The hand-off: MPOP either renders the wizard or redirects the whole of it,
      // so asserting here covers every page that follows.
      await assertExpectedService(this.page, "Setup online check ins");
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
  /**
   * Drive the wizard as far as the date and frequency page and stop there, so a
   * test can exercise it without completing a setup it does not need.
   */
  async completeSetupToDateFrequency(setup: {
    eligibilityIds: number[];
    rationale: string;
  }): Promise<DateFrequencyPage> {
    await test.step("Complete eligibility to the check in date page", async () => {
      await this.pages.eligibility.assertOnPage();
      await this.pages.eligibility.completePage(setup.eligibilityIds);

      await this.pages.eligible.assertOnPage();
      await this.pages.eligible.completePage(0);

      await this.pages.spoApproval.assertOnPage();
      await this.pages.spoApproval.completePage();

      await this.pages.rationale.assertOnPage();
      await this.pages.rationale.completePage(setup.rationale);

      await this.pages.dateFrequency.assertOnPage();
    });
    return this.pages.dateFrequency;
  }

  async completeSetupToSummary(
    crn: string,
    setup: SetupValues,
  ): Promise<CheckInSummaryPage> {
    return test.step("Complete set up online check ins", async () => {
      const dateFrequency = await this.completeSetupToDateFrequency(setup);
      await dateFrequency.completePage(setup.date, setup.frequency);

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

  async changeContactPreferenceFromSummary(
    crn: string,
    summary: CheckInSummaryPage,
    opts: {
      preference?: Preference;
      contact?: ContactDetails;
    },
  ): Promise<void> {
    await summary.clickChange("contactPreference");
    // TODO(legacy-mpop): Delete the else branch and unindent when legacy MPOP is
    // removed. Same divergence as completeContactPreference, on the ?cya=true path
    // back from check your answers.
    if (!LEGACY_MPOP) {
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
