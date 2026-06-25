import { expect, Page } from "@playwright/test";
import { login as loginToDelius } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/login.mjs";
import { deliusPerson } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/person.mjs";
import { createOffender } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/create-offender.mjs";
import { createCommunityEvent } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/event/create-event.mjs";
import { internalTransfer } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/transfer/internal-transfer.mjs";
import { TEST_TEAM, TEST_STAFF } from "../../../data/delius/testData";
import { NewOffender } from "../../../data/delius/types";
import { recordCreatedCrn } from "../../utils/createdCrns";
import { dismissModals } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/find-offender.mjs";
import { selectOption } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/inputs.mjs";

export default class DeliusOffenderJourney {
  constructor(private readonly page: Page) {}

  async createTestOffender(): Promise<NewOffender> {
    const person = deliusPerson();
    await loginToDelius(this.page);
    const crn = await createOffender(this.page, {
      person,
      providerName: TEST_TEAM.provider,
    });
    if (!crn) {
      throw new Error("Delius did not return a CRN for the new offender");
    }
    recordCreatedCrn(crn);

    // Ndelius intermittently throws error during allocation (e.g. dropdrown not populated); a retry clears it.
    // toPass re-runs the who;e transfer until it succeeds or timeout is hit
    await expect(async () => {
      await internalTransfer(this.page, {
        crn,
        allocation: { team: TEST_TEAM, staff: TEST_STAFF },
      });
    }).toPass({ timeout: 20000, intervals: [2000, 5000, 10000] });
    await createCommunityEvent(this.page, { crn });
    return {
      crn,
      person: {
        firstName: person.firstName,
        lastName: person.lastName,
        dob: person.dob,
      },
    };
  }

  async deleteTestOffenders(crns: string[]): Promise<string[]> {
    await loginToDelius(this.page);
    const notDeleted: string[] = [];
    for (const [index, crn] of crns.entries()) {
      console.log(`Deleting offender ${index + 1} of ${crns.length}: ${crn}`);
      try {
        const opened = await this.openOffenderForDeletion(crn);
        if (!opened) {
          notDeleted.push(crn);
          console.log(`No record found for ${crn} - skipping`);
          continue;
        }
        await this.deleteCurrentOffender();
      } catch (error) {
        notDeleted.push(crn);
        console.log(`Failed to delete ${crn}: ${(error as Error).message}`);
      }
    }

    return notDeleted;
  }

  async openOffenderForDeletion(crn: string): Promise<boolean> {
    await this.page
      .locator("a", {
        hasText: "National search",
      })
      .click();
    await expect(this.page).toHaveTitle(/National Search/);
    await this.page.waitForLoadState("networkidle");
    await selectOption(this.page, "#otherIdentifier", "[Not Selected]");
    await expect(async () => {
      await this.page.fill("#crn\\:inputText", crn);
      await expect(this.page.locator("#crn\\:inputText")).toHaveValue(crn);
    }).toPass({ timeout: 10000 });
    await this.page.click("#searchButton");

    const viewLink = this.page
      .locator("tr", { hasText: crn })
      .locator("a", { hasText: "View" })
      .first();

    const found = await viewLink
      .waitFor({ state: "visible", timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    if (!found) {
      return false;
    }
    await viewLink.click();
    await dismissModals(this.page);
    return true;
  }

  async deleteCurrentOffender(): Promise<void> {
    await this.page.getByRole("link", { name: "Event List" }).click();
    await this.page.waitForLoadState("networkidle");
    const eventDelete = this.page.getByRole("link", { name: "delete" });
    if ((await eventDelete.count()) > 0) {
      await eventDelete.first().click();
      await this.page.getByRole("button", { name: "Confirm" }).click();
    }
    await this.page.getByRole("link", { name: "Personal Details" }).click();
    await this.page.getByRole("button", { name: "Delete" }).click();
    await this.page.getByRole("button", { name: "Confirm" }).click();
  }
}
