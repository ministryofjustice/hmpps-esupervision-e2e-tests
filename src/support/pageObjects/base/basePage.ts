import { expect, Locator, Page } from '@playwright/test'

export default abstract class BasePage {
  readonly page: Page
  protected readonly title?: string | RegExp

  constructor(page: Page, title?: string | RegExp) {
    this.page = page
    this.title = title
  }

  protected qa(name: string, root: Locator | Page = this.page): Locator {
    return root.locator(`[data-qa="${name}"]`)
  }

  protected byId(id: string, root: Locator | Page = this.page): Locator {
    return root.locator(`#${id}`)
  }

  protected byCss(cls: string, root: Locator | Page = this.page): Locator {
    return root.locator(`.${cls}`)
  }

  getSummaryValue(key: string): Locator {
    return this.page
      .locator('.govuk-summary-list__key', { hasText: key })
      .locator('..').locator('.govuk-summary-list__value')
  }

  getSummaryChangeLink(key: string): Locator {
    return this.page
      .locator('.govuk-summary-list__key', { hasText: key })
      .locator('..').locator('.govuk-summary-list__actions')
      .locator('a', { hasText: 'Change' })
  }


  getByID(id: string, locator: Locator | Page = this.page) {
    return locator.locator(`[id="${id}"]`);
  }
}