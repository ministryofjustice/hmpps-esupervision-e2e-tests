import { Locator, Page } from '@playwright/test'
import PopBasePage from './checkinBasePage'
import CheckinBasePage from './checkinBasePage'


export default class LivenessOutcomePage extends CheckinBasePage {
  constructor(page: Page) { super(page) }

  heading(): Locator                 { return this.page.locator('h1') }
  introText(): Locator               { return this.page.locator('.govuk-body').first() }
  continueLink(): Locator            { return this.page.locator('a.govuk-button', { hasText: 'Continue' }) }
  verifyAgainLink(): Locator         { return this.page.locator('a.govuk-button', { hasText: 'Verify identity again' }) }
  recordVideoInsteadLink(): Locator  { return this.page.locator('a.govuk-button', { hasText: 'Record a video instead' }) }

  async clickContinue(): Promise<void> { await this.continueLink().click() }
}