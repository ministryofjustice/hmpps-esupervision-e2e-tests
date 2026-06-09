import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";
import { MentalHealthOption } from "../../../data/models";

export default class MentalHealthPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, "How have you been feeling since we last spoke?");
  }

  radio(option: MentalHealthOption): Locator {
    return this.page.locator(`input[name="mentalHealth"][value="${option}"]`);
  }

  veryWellRadio() {
    return this.radio("VERY_WELL");
  }
  WellRadio() {
    return this.radio("WELL");
  }
  okRadio() {
    return this.radio("OK");
  }
  notGreatRadio() {
    return this.radio("NOT_GREAT");
  }
  strugglingRadio() {
    return this.radio("STRUGGLING");
  }

  async selectOption(option: MentalHealthOption) {
    return this.radio(option).check();
  }

  async selectOptionAndContinue(option: MentalHealthOption): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }
}
