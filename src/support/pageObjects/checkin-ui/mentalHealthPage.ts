import { Page, expect } from "@playwright/test";
import PopBasePage from "./checkinBasePage";
import CheckinBasePage from "./checkinBasePage";
import { MentalHealthOption } from "../../data/models";


export default class MentalHealthPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, "How have you been feeling since we last spoke?");
  }

  veryWellRadio() {
    return this.page.locator(`input[name="mentalHealth"][value="VERY_WELL"]`);
  }
  WellRadio() {
    return this.page.locator(`input[name="mentalHealth"][value="VERY_WELL"]`);
  }
  okRadio() {
    return this.page.locator(`input[name="mentalHealth"][value="VERY_WELL"]`);
  }
  notGreatRadio() {
    return this.page.locator(`input[name="mentalHealth"][value="VERY_WELL"]`);
  }
  strugglingRadio() {
    return this.page.locator(`input[name="mentalHealth"][value="VERY_WELL"]`);
  }

  async selectOption(option: MentalHealthOption) {
    return this.page.locator(`input[name="mentalHealth"][value="${option}"]`).check();
  }

  async selectOptionAndContinue(option: MentalHealthOption): Promise<void> {
    await this.selectOption(option)
    await this.clickContinue()
  }

  
}
