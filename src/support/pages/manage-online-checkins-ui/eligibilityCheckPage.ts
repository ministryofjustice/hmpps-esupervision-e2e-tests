import { Locator, Page } from "@playwright/test";
import { EligibilityAnswer } from "../../../data/models";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class EligibilityCheckPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, /^\s*Check if .+ is eligible to use online check ins\s*$/);
  }

  answerCheckbox(answer: EligibilityAnswer): Locator {
    return this.page.locator(
      `input[name$="[checkins][eligibility]"][value="${answer}"]`,
    );
  }

  cancelLink(): Locator {
    return this.page.getByRole("link", { name: "Cancel and go back" });
  }

  async completePage(answers: EligibilityAnswer[]): Promise<void> {
    for (const answer of answers) {
      await this.answerCheckbox(answer).check();
    }
    await this.clickContinue();
  }
}
