import { Locator, Page } from "@playwright/test";

export default class Layer1AssessmentPage {
  constructor(private readonly page: Page) {}

  predictorsLink(): Locator {
    return this.page.getByRole("link", { name: "Predictors", exact: true });
  }

  convictionDateField(): Locator {
    return this.page.getByLabel("Date of current conviction");
  }

  async setConvictionDate(value: string): Promise<void> {
    const field = this.convictionDateField();
    await this.page.waitForTimeout(200);
    await field.clear();
    await this.page.waitForTimeout(200);
    await field.pressSequentially(value, { delay: 100 });
  }

  predictorQuestionsLink(): Locator {
    return this.page.getByRole("link", { name: "Predictor Questions" });
  }

  selfAssessmentLink(): Locator {
    return this.page.getByRole("link", { name: "Self Assessment Form" });
  }

  incompleteSelfAssessmentRationale(): Locator {
    return this.page.getByLabel(
      "Please provide a clear rationale for not fully completing the Self Assessment Questionnaire",
    );
  }

  markAsCompleteButton(): Locator {
    return this.page.locator('input.btn[value="Mark As Complete"]');
  }

  basicSentencePlanLink(): Locator {
    return this.page.getByRole("link", { name: "Basic Sentence Plan" });
  }

  partnerRelationshipField(): Locator {
    return this.page.getByLabel("Current relationship with partner");
  }

  totalSanctionsField(): Locator {
    return this.page.getByLabel("Total number of sanctions for all offences");
  }

  firstSanctionAgeField(): Locator {
    return this.page.getByLabel("Age at first sanction");
  }

  violentSanctionsField(): Locator {
    return this.page.getByLabel(
      "How many of the total number of sanctions involved violent offences",
    );
  }

  currentOffenceSexualMotivation(): Locator {
    return this.page.getByLabel(
      "Does the current offence have a sexual motivation?",
    );
  }

  strangerContactOffence(): Locator {
    return this.page.getByLabel(
      "Does the current offence involve actual/attempted direct contact against a victim who was a stranger?",
    );
  }

  mostRecentSexualSanctionDate(): Locator {
    return this.page.getByLabel(
      "Date of most recent sanction involving a sexual/sexually motivated offence",
    );
  }

  saveButton(): Locator {
    return this.page.locator('input[value="Save"]').first();
  }
}
