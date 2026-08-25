import { Locator, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class ManageCheckInsPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Online check ins");
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

  questionsAddedBanner(): Locator {
    return this.page.getByText(/added additional questions/);
  }

  // "Next check in" shown above the questions card. Also used to cross check the
  // date on the add questions page.
  nextCheckinDate(): Locator {
    return this.getQA("nextCheckInValue").first();
  }

  private settingsCard(): Locator {
    return this.getQA("checkinSettingsCard");
  }

  // The same data-qa appears twice on the page, so the settings assertions scope
  // to the check in settings card rather than taking the first match.
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
