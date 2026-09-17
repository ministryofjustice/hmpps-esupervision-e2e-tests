import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import { escapeRegExp } from "../../utils/url";
import { LEGACY_MPOP } from "../../utils/legacyMpop";

export default class ManageCheckInsPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Online check ins");
  }

  /**
   * Back to the person's overview. Both services point it at `/case/{crn}`, but
   * MOCI renders a back link where legacy MPOP renders a one-item "< Back"
   * breadcrumb. Branched on the flag rather than matched with one either-or
   * selector, so it always resolves to a single element.
   *
   * TODO(legacy-mpop): Drop the branch when legacy MPOP is removed - this page is
   * the only one where the two services differ.
   */
  backLink(): Locator {
    return LEGACY_MPOP
      ? this.getClass("govuk-breadcrumbs__link")
      : this.getClass("govuk-back-link");
  }

  async clickStopCheckIns(): Promise<void> {
    await this.getQA("stop-checkin-btn").click();
  }
  async clickRestartCheckIns(): Promise<void> {
    await this.getQA("restart-checkin-btn").click();
  }

  changeQuestionsLink(): Locator {
    return this.page.getByRole("link", { name: /Change questions/ });
  }
  async clickChangeQuestions(): Promise<void> {
    await this.changeQuestionsLink().click();
  }

  changeContactDetailsLink(): Locator {
    return this.page.getByRole("link", { name: /change contact details/i });
  }
  async clickChangeContactDetails(): Promise<void> {
    await this.changeContactDetailsLink().click();
  }

  changeCheckinSettingsLink(): Locator {
    return this.page.getByRole("link", { name: /Change check in settings/i });
  }
  async clickChangeCheckinSettings(): Promise<void> {
    await this.changeCheckinSettingsLink().click();
  }

  // Scoped to this person's first name (the only name the banner shows) so it
  // can't match a banner for a different case. ’ is the banner's curly
  // apostrophe in "<name>'s next online check in".
  questionsAddedBanner(firstName: string): Locator {
    return this.page.getByText(
      new RegExp(
        `added additional questions to ${escapeRegExp(firstName)}’s next online check in`,
      ),
    );
  }

  // "Next check in" inside the upcoming check in card. The same data-qa also
  // appears in the settings card from a different source value, so this is scoped
  // rather than taken by DOM order. Used to cross check the date on the add
  // questions page.
  nextCheckinDate(): Locator {
    return this.getQA("nextCheckInValue", this.questionCard());
  }

  private settingsCard(): Locator {
    return this.getQA("checkinSettingsCard");
  }

  // Scoped to the settings card: the same data-qa is also rendered in the
  // questions card.
  settingsNextCheckinDate(): Locator {
    return this.getQA("nextCheckInValue", this.settingsCard());
  }

  settingsFrequency(): Locator {
    return this.getQA("frequencyValue", this.settingsCard());
  }

  questionCard(): Locator {
    return this.getQA("checkinQuestionsCard");
  }
}
