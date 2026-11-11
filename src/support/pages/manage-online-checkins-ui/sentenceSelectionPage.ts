import { Locator, Page } from "@playwright/test";
import { SENTENCE_SELECTION_TITLE } from "../../../data/manage-online-checkins-ui/pageTitles";
import PractitionerBasePage from "../base/practitionerBasePage";

/** Only shown when the person has 2 or more active sentences. */
export default class SentenceSelectionPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, SENTENCE_SELECTION_TITLE);
  }

  // The radios' legend is the page heading, so there is no data-qa="pageHeading".
  override async assertOnPage(timeout = 10000): Promise<void> {
    await this.assertHeadingOnPage(timeout);
  }

  headingLocator(): Locator {
    return this.page.getByRole("heading", { level: 1, name: this.heading });
  }

  private options(): Locator {
    return this.getQA("sentenceSelection").locator(".govuk-radios__item");
  }

  /** Sentence descriptions, in page order. */
  optionLabels(): Locator {
    return this.options().locator(".govuk-radios__label");
  }

  /** "Sentence end date: ..." hints, in page order. */
  optionHints(): Locator {
    return this.options().locator(".govuk-radios__hint");
  }

  selectedOptionLabel(): Locator {
    return this.options()
      .filter({ has: this.page.locator("input:checked") })
      .locator(".govuk-radios__label");
  }

  async completePage(index = 0): Promise<void> {
    await this.clickRadioById("sentenceSelection", index);
    await this.clickContinue();
  }
}
