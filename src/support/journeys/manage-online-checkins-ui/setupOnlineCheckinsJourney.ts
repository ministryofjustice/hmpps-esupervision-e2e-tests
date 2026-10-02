import { expect, Page, test } from "@playwright/test";
import CheckInSummaryPage from "../../pages/manage-online-checkins-ui/checkInSummaryPage";
import DateFrequencyPage, {
  FrequencyOptions,
} from "../../pages/manage-online-checkins-ui/dateFrequencyPage";
import { loginToMpop } from "../../pages/mpop/loginPage";
import { PhotoOptions } from "../../pages/manage-online-checkins-ui/photoOptionsPage";
import { ManageCheckinsPages } from "../../pages/manage-online-checkins-ui/manageCheckinsPages";
import CheckInConfirmationPage from "../../pages/manage-online-checkins-ui/checkInConfirmationPage";
import {
  CONTACT_PREFERENCE_TITLE,
  EDIT_CONTACT_DETAILS_TITLE,
  ELIGIBILITY_CHECK_TITLE,
  IS_ELIGIBLE_TITLE,
  NOT_ELIGIBLE_TITLE,
  confirmContactDetailTitle,
} from "../../../data/manage-online-checkins-ui/pageTitles";
import {
  Preference,
  ContactDetails,
  EligibilityAnswer,
} from "../../../data/models";
import {
  assertCaseBanner,
  assertManageCheckinsPage,
  assertManageOnlineCheckinsUiTitle,
} from "../../assertions/manage-online-checkins-ui/manageCheckinsAssertions";
import {
  assertAbsoluteMpopHref,
  followToMpop,
  MPOP_PATH,
} from "../../assertions/manage-online-checkins-ui/mpopHandoff";

type ExpectedContactRoute = "missing" | "confirm";

interface ContactPreferenceValues {
  preference: Preference;
  /** The detail that should end up on file - entered, or replacing what is there. */
  contact?: ContactDetails;
  expectedContactRoute?: ExpectedContactRoute;
}

interface SetupValues extends ContactPreferenceValues {
  date: string;
  frequency: FrequencyOptions;
  photo: PhotoOptions;
  /** Eligibility check answers. Defaults to ["none"] for standard setup. */
  eligibilityAnswers?: EligibilityAnswer[];
  /** Pilot question answer. Only used if pilot question is shown. Defaults to true. */
  pilotAnswer?: boolean;
}

// A new offender's tier is calculated after their OASys assessment, and MOCI
// sends them to not-eligible until it lands - so opening setup can take a
// while.
const OPEN_SETUP_TIMEOUT = 60000;

export default class SetupOnlineCheckinsJourney {
  private readonly pages: ManageCheckinsPages;
  private onFileContact?: string;

  constructor(private readonly page: Page) {
    this.pages = new ManageCheckinsPages(page);
  }

  /**
   * The contact detail actually saved by the wizard - not necessarily the
   * value the test passed in, since the confirm route ignores that.
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
   * Asserts we're on the "confirm this email/mobile?" page (MOCI only).
   */
  private async assertOnConfirmContactPage(
    crn: string,
    preference: Preference,
  ): Promise<void> {
    const confirm = this.pages.contactPreference;
    const detail =
      preference === Preference.EMAIL ? "email address" : "mobile number";

    await assertManageCheckinsPage(
      this.page,
      crn,
      confirmContactDetailTitle(detail),
    );
    // Match from the start only - the caption also contains "This information is saved in NDelius".
    await expect(
      confirm.confirmCaption(),
      `Should be confirming the person's ${detail}`,
    ).toContainText(new RegExp(`^\\s*Confirm .+'s ${detail}`));

    // Value comes from NDelius, not the test, so just check its shape (email/phone format).
    await expect(
      confirm.confirmedContactValue(),
      `Should show the ${detail} held in NDelius`,
    ).toHaveText(preference === Preference.EMAIL ? /\S+@\S+/ : /\d{5,}/);

    await expect(
      confirm.confirmRadiosGroup(),
      "Should show the confirm page's radios",
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
    await assertCaseBanner(this.page, crn);
    const contactPreference = this.pages.contactPreference;
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
    if (setup.expectedContactRoute === "missing") {
      await expect(contactPreference.missingDetailsField()).toBeVisible();
    } else if (setup.expectedContactRoute === "confirm") {
      await expect(contactPreference.confirmDetailsGroup()).toBeVisible();
    }

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
          "manage-online-checkins-ui asked for a missing contact detail but setup.contact has none for the chosen preference",
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
        // A value was supplied for a detail already on file, so reject it and edit instead.
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
  }
  async login(): Promise<void> {
    await test.step("Log in to MPOP as practitioner", async () => {
      await loginToMpop(this.page);
    });
  }

  async startSetup(crn: string): Promise<void> {
    await this.openSetup(crn, () =>
      assertManageCheckinsPage(this.page, crn, ELIGIBILITY_CHECK_TITLE),
    );
  }

  /** For a CRN MOCI rules out before asking anything, e.g. with no tier. */
  async startSetupExpectingNotEligible(crn: string): Promise<void> {
    await this.openSetup(crn, () =>
      assertManageCheckinsPage(this.page, crn, NOT_ELIGIBLE_TITLE),
    );
  }

  private async openSetup(
    crn: string,
    assertLanding: () => Promise<void>,
  ): Promise<void> {
    await test.step(`Open setup online check ins for ${crn}`, async () => {
      // The service intermittently shows its generic error page right after the
      // offender is created (eligibility page's name lookup isn't ready yet) -
      // retry the whole navigation, not just wait longer, since the error page
      // itself never turns into the eligibility page.
      await expect(async () => {
        await this.pages.overview.goTo(crn);
        await this.pages.overview.assertOnPage();
        await this.pages.overview.clickSetupOnlineCheckIns();
        // MPOP either shows the wizard itself or redirects to MOCI - this assertion covers both.
        await assertLanding();
      }).toPass({
        timeout: OPEN_SETUP_TIMEOUT,
        intervals: [2000, 5000, 10000, 20000],
      });
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
  async completeSetupToDateFrequency(
    crn: string,
    eligibilityAnswers?: EligibilityAnswer[],
    pilotAnswer?: boolean,
  ): Promise<DateFrequencyPage> {
    await test.step("Complete eligibility to the check in date page", async () => {
      // startSetup() already retried until this page rendered, so this is just
      // the normal on-page assertion, not extra flakiness handling.
      await assertManageCheckinsPage(this.page, crn, ELIGIBILITY_CHECK_TITLE);
      await this.completeEligibility(crn, eligibilityAnswers, pilotAnswer);

      await this.pages.dateFrequency.assertOnPage();
    });
    return this.pages.dateFrequency;
  }

  /**
   * Answers eligibility check questions (default: "None of these apply") and follows
   * the tier-dependent route through the eligibility wizard. Tier determines which
   * questions appear and which pages are shown:
   * - Tier A/B/C: Show pilot question
   * - Tier D-G: Skip pilot, go directly to is-eligible
   * - Tier A/B: Show accredited programme and youth sentence questions
   * - Tier C-G: Do not show accredited programme and youth sentence
   */
  private async completeEligibility(
    crn: string,
    answers: EligibilityAnswer[] = ["none"],
    pilotAnswer: boolean = true,
  ): Promise<void> {
    const moci = this.pages;
    await moci.eligibilityCheck.completePage(answers);

    const notEligibleHeading = moci.notEligible.headingLocator();
    const pilotYes = moci.pilotCheck.yesRadio();
    const eligibleDiscussion = moci.isEligible.discussionCheckbox("optional");
    await expect(
      notEligibleHeading.or(pilotYes).or(eligibleDiscussion),
    ).toBeVisible();

    if (await notEligibleHeading.isVisible()) {
      await assertManageCheckinsPage(this.page, crn, NOT_ELIGIBLE_TITLE);
      throw new Error(
        `CRN ${crn} was ruled not eligible during setup eligibility checks`,
      );
    }

    if (await pilotYes.isVisible()) {
      await moci.pilotCheck.answer(pilotAnswer);
      // If pilot was answered "No", person is disqualified
      if (!pilotAnswer) {
        await assertManageCheckinsPage(this.page, crn, NOT_ELIGIBLE_TITLE);
        throw new Error(
          `CRN ${crn} was ruled not eligible because the pilot answer was No`,
        );
      }
    }

    await assertManageCheckinsPage(this.page, crn, IS_ELIGIBLE_TITLE);
    await moci.isEligible.completePage();
  }

  async completeSetupToSummary(
    crn: string,
    setup: SetupValues,
  ): Promise<CheckInSummaryPage> {
    return test.step("Complete set up online check ins", async () => {
      const dateFrequency = await this.completeSetupToDateFrequency(
        crn,
        setup.eligibilityAnswers,
        setup.pilotAnswer,
      );
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

  /**
   * The confirmation page's two links back to MPOP: check the all cases href,
   * then follow the record link.
   *
   * Kept out of submitSetup, which nearly every setup in the suite runs
   * through, so a link change fails a link test rather than a pile of unrelated
   * ones. The page only exists just after submitting, so call this straight
   * afterwards. It navigates away, so call it last.
   */
  async assertConfirmationLinksLandInMpop(crn: string): Promise<void> {
    const confirmation = new CheckInConfirmationPage(this.page);
    await test.step("Confirmation links hand off to MPOP", async () => {
      // Check the href first - the click below leaves this page.
      await assertAbsoluteMpopHref(
        confirmation.allCasesLink(),
        "Return to all cases",
        MPOP_PATH.allCases,
      );
      await followToMpop(
        this.page,
        confirmation.overviewLink(),
        "View the person's record",
        MPOP_PATH.overview(crn),
        () => this.pages.overview.assertOnPage(),
      );
    });
  }

  async changeContactPreferenceFromSummary(
    crn: string,
    summary: CheckInSummaryPage,
    opts: ContactPreferenceValues,
  ): Promise<void> {
    await summary.clickChange("contactPreference");
    await this.completeContactPreference(crn, opts);
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

  async changePhotoFromSummary(
    summary: CheckInSummaryPage,
    photo: PhotoOptions,
  ): Promise<void> {
    await summary.clickChange("photo");
    await this.completePhotoSteps(photo);
    await summary.assertOnPage();
  }
}
