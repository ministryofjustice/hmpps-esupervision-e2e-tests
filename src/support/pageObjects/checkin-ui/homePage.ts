import { Locator, Page } from "@playwright/test";
import CheckinBasePage from "./checkinBasePage";


export default class CheckinIndexPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, 'Check in with your probation officer')
  }

  startButton(): Locator {
    return this.page.locator('button', { hasText: 'Start now' })
  }

  async clickStart(): Promise<void> {
    await this.startButton().click()
  }
}