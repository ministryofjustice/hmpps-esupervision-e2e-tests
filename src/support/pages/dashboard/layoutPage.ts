import { Locator, Page } from "@playwright/test";

/**
 * Page furniture shared by every /v2statistics page, rendered by
 * partials/layout.njk: govukHeader, govukServiceNavigation, govukPhaseBanner
 * and govukFooter.
 */
export default class LayoutPage {
  constructor(private readonly page: Page) {}

  header(): Locator {
    return this.page.locator(".govuk-header");
  }

  homepageLink(): Locator {
    return this.header().getByRole("link", { name: "GOV.UK" });
  }

  serviceName(): Locator {
    return this.page.locator(".govuk-service-navigation__service-name");
  }

  phaseBanner(): Locator {
    return this.page.locator(".govuk-phase-banner");
  }

  phaseTag(): Locator {
    return this.phaseBanner().locator(".govuk-phase-banner__content__tag");
  }

  footer(): Locator {
    return this.page.locator(".govuk-footer");
  }

  footerLink(name: string): Locator {
    return this.footer().getByRole("link", { name });
  }
}
