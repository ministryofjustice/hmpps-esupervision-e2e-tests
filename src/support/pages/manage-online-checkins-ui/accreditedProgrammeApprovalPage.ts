import { Page } from "@playwright/test";
import { ACCREDITED_PROGRAMME_APPROVAL_TITLE } from "../../../data/manage-online-checkins-ui/pageTitles";
import PractitionerBasePage from "../base/practitionerBasePage";

export default class AccreditedProgrammeApprovalPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, ACCREDITED_PROGRAMME_APPROVAL_TITLE);
  }

  async completePage(): Promise<void> {
    await this.page
      .getByRole("checkbox", {
        name: /discussed the person with their accredited programme treatment manager/,
      })
      .check();
    await this.clickContinue();
  }
}
