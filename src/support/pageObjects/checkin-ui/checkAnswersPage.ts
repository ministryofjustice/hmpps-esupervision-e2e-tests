import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "./checkinBasePage";



export default class CheckAnswersPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, 'Check your answers before you complete your check in')
  }

  confirmCheckbox(): Locator       { return this.page.locator('input[name="checkAnswers"][value="CONFIRM"]') }
  completeCheckinButton(): Locator { return this.page.locator('button', { hasText: 'Complete check in' }) }
  
  async submitCheckin(): Promise<void> {
    await this.confirmCheckbox().check()
    await this.completeCheckinButton().click()
  }
}