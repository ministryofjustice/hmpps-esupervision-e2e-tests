import { Locator, Page } from '@playwright/test'
import CheckinBasePage from './checkinBasePage'


export default class LivenessInformPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, 'Confirm your identity')
  }
  
  continueLink():Locator { return this.page.locator('a.govuk-button', { hasText: 'Continue' }) }

  async clickContinue(): Promise<void> { await this.continueLink().click() }
}