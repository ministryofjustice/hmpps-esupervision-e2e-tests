import { expect, Locator, Page } from "@playwright/test";
import { QuestionKind } from "../../../data/models";
import { WRITE_OWN_QUESTION_TITLE } from "../../../data/manage-online-checkins-ui/pageTitles";
import PractitionerBasePage from "../base/practitionerBasePage";

const TEMPLATE_QUESTION_HEADING = "What do you want to ask";

const EDIT_QUESTION_HEADINGS: Record<QuestionKind, string> = {
  template: TEMPLATE_QUESTION_HEADING,
  bespoke: WRITE_OWN_QUESTION_TITLE,
};

export default class EditQuestionPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, TEMPLATE_QUESTION_HEADING);
  }

  async assertOnRoute(kind: QuestionKind, timeout = 10000): Promise<void> {
    await expect(this.getQA("pageHeading")).toContainText(
      EDIT_QUESTION_HEADINGS[kind],
      { timeout },
    );
  }

  questionInput(): Locator {
    return this.page.locator('input[name*="draftQuestionInput"]');
  }

  async enterQuestion(text: string): Promise<void> {
    await this.questionInput().fill(text);
    await this.getQA("submit-btn").click();
  }
}
