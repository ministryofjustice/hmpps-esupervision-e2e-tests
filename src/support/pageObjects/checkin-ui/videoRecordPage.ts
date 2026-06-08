import { Locator, Page } from '@playwright/test'
import CheckinBasePage from './checkinBasePage'

export default class VideoRecordPage extends CheckinBasePage {
  constructor(page: Page) { super(page, 'you') } // all h1 variants contain 'you'

  heading(): Locator          { return this.page.locator('h1') }
  continueLink(): Locator     { return this.page.locator('a.govuk-button', { hasText: 'Continue' }) }
  tryAgainLink(): Locator     { return this.page.locator('a.govuk-button', { hasText: 'Record again' }) }
  submitAnywayLink(): Locator { return this.page.locator('a.govuk-button--secondary', { hasText: 'Submit anyway' }) }

  async clickContinue(): Promise<void>     { await this.continueLink().click() }
  async clickSubmitAnyway(): Promise<void> { await this.submitAnywayLink().click() }
}