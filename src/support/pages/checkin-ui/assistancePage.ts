import { Page, Locator } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";
import {
  AssistanceOption,
  AssistanceOptionWithComment,
  AssistanceSelection,
} from "../../../data/models";

export default class AssistancePage extends CheckinBasePage {
  constructor(page: Page) {
    super(
      page,
      "Is there anything you need support with or want to let us know about?",
    );
  }

  private checkbox(option: AssistanceOption): Locator {
    return this.page.locator(`input[name="assistance"][value="${option}"]`);
  }

  private textarea(option: AssistanceOptionWithComment): Locator {
    const id =
      option
        .toLowerCase()
        .replace(/_(\w)/g, (_: string, p1: string) => p1.toUpperCase()) +
      "Support";
    return this.getByID(id);
  }

  async selectNoHelpAndContinue(): Promise<void> {
    await this.checkbox("NO_HELP").check();
    await this.clickContinue();
  }

  /** Selects one or more support needs with comments. */
  async selectOptionsAndContinue(
    selections: AssistanceSelection[],
  ): Promise<void> {
    for (const { option, comment } of selections) {
      await this.checkbox(option).check();
      await this.textarea(option).fill(comment);
    }
    await this.clickContinue();
  }
}
