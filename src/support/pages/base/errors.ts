import { Locator, Page } from "@playwright/test";

/** The GOV.UK error summary at the top of a page. */
export const errorSummary = (page: Page): Locator =>
  page.locator(".govuk-error-summary");

/**
 * The inline error under a field. `hasText` is a substring match, so pass enough of
 * the message to be unique on the page - two fields with overlapping wording would
 * otherwise be a strict mode violation.
 */
export const fieldError = (page: Page, message: string): Locator =>
  page.locator(".govuk-error-message", { hasText: message });
