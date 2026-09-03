import { expect, Page } from "@playwright/test";
import { login as loginToDelius } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/login.mjs";
import { deliusPerson } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/person.mjs";
import { createOffender } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/create-offender.mjs";
import { createCommunityEvent } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/event/create-event.mjs";
import { internalTransfer } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/transfer/internal-transfer.mjs";
import { TEST_TEAM, TEST_STAFF } from "../../../data/delius/testData";
import { NewOffender } from "../../../data/delius/types";
import { recordCreatedCrn } from "../../utils/createdCrns";
import {
  dismissModals,
  findOffenderByName,
} from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/find-offender.mjs";
import { selectOption } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/inputs.mjs";

export default class DeliusOffenderJourney {
  constructor(private readonly page: Page) {}

  async createTestOffender(): Promise<NewOffender> {
    const person = deliusPerson();
    await loginToDelius(this.page);
    let crn: string | undefined = await createOffender(this.page, {
      person,
      providerName: TEST_TEAM.provider,
    });
    if (!crn) {
      // createOffender (vendored) swallows any error whose page title isn't
      // exactly "Error Page" and returns undefined - the offender may still
      // have been created despite the CRN readback failing. Fall back to a
      // name search rather than retrying createOffender itself, which would
      // create a duplicate record if the first attempt actually succeeded.
      crn = await this.recoverCrnByName(person);
    }
    if (!crn) {
      throw new Error("Delius did not return a CRN for the new offender");
    }
    recordCreatedCrn(crn);

    // NDelius is intermittently slow to render the transfer page (title stays
    // empty past the assertion's timeout); a retry with a longer overall
    // window clears it.
    // toPass re-runs the whole transfer until it succeeds or timeout is hit
    await expect(async () => {
      await internalTransfer(this.page, {
        crn,
        allocation: { team: TEST_TEAM, staff: TEST_STAFF },
      });
    }).toPass({ timeout: 45000, intervals: [3000, 5000, 10000, 15000] });
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

  private async recoverCrnByName(person: {
    firstName: string;
    lastName: string;
  }): Promise<string | undefined> {
    try {
      let crn: string | undefined;
      await expect(async () => {
        await findOffenderByName(this.page, person.firstName, person.lastName);
        const row = this.page.locator("#offendersTable tbody tr").first();
        await expect(row).toBeVisible({ timeout: 5000 });
        const text = await row.locator("td").first().textContent();
        expect(text?.trim()).toBeTruthy();
        crn = text?.trim();
      }).toPass({ timeout: 15000, intervals: [2000, 5000] });
      return crn;
    } catch {
      return undefined;
    }
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
