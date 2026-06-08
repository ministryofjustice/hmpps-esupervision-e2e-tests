import { test, expect } from '@playwright/test'
import process from 'process'

   const baseUrl = (): string => {
    if (!process.env.PROBATION_CHECK_IN_URL)
    throw new Error("PROBATION_CHECK_IN_URL env var is not set");
  console.log(process.env.PROBATION_CHECK_IN_URL);
  return  process.env.PROBATION_CHECK_IN_URL;
}

test.describe('Accessibility statement', () => {
  test('renders', async ({ page }) => {
    console.log(baseUrl)
    await page.goto(`${baseUrl()}/accessibility`)
    await expect(page.locator('h1')).toContainText('Accessibility statement')
  })
})

test.describe('Guidance', () => {
  test('renders', async ({ page }) => {
    await page.goto(`${baseUrl()}/guidance`)
    await expect(page.locator('h1')).toContainText('About the Check in with your probation officer service')
  })
})

test.describe('Cookies', () => {
  test('renders', async ({ page }) => {
    await page.goto(`${baseUrl()}/cookies`)
    await expect(page.locator('h1')).toContainText('Cookies')
  })
})

test.describe('Privacy notice', () => {
  test('renders', async ({ page }) => {
    await page.goto(`${baseUrl()}/privacy-notice`)
    await expect(page.locator('h1')).toContainText('Privacy Notice')
  })
})
