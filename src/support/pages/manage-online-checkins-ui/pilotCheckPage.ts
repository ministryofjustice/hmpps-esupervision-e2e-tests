import { Locator, Page } from "@playwright/test";
import { PILOT_CHECK_TITLE } from "../../../data/manage-online-checkins-ui/pageTitles";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class PilotCheckPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, PILOT_CHECK_TITLE);
  }

  yesRadio(): Locator {
    return this.page.getByRole("radio", { name: "Yes" });
  }

  private noRadio(): Locator {
    return this.page.getByRole("radio", { name: "No" });
  }

  async answer(hasPilotCases: boolean): Promise<void> {
    await (hasPilotCases ? this.yesRadio() : this.noRadio()).check();
    await this.clickContinue();
  }

  async continueWithoutAnswering(): Promise<void> {
    await this.clickContinue();
  }
}
