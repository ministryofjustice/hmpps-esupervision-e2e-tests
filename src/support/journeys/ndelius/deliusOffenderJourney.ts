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
  findFirstOffender,
} from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/find-offender.mjs";
import { selectOption } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/inputs.mjs";
import { DeliusDateFormatter } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/date-time.mjs";
import NationalSearchPage from "../../pages/ndelius/nationalSearchPage";
import OffenderRecordPage from "../../pages/ndelius/offenderRecordPage";

export default class DeliusOffenderJourney {
  private readonly nationalSearchPage: NationalSearchPage;
  private readonly offenderRecordPage: OffenderRecordPage;

  constructor(private readonly page: Page) {
    this.nationalSearchPage = new NationalSearchPage(page);
    this.offenderRecordPage = new OffenderRecordPage(page);
  }

  async createTestOffender(): Promise<NewOffender> {
    const person = deliusPerson();
    await loginToDelius(this.page);
    let crn: string | undefined = await createOffender(this.page, {
      person,
      providerName: TEST_TEAM.provider,
    });
    if (!crn) {
      // createOffender may have succeeded despite returning no CRN,
      // so recover by name instead of retrying (which could create a duplicate).
      crn = await this.recoverCrnByName(person);
    }
    if (!crn) {
      // Creation may still have gone through even though nothing got recorded for
      // cleanup - print identifying details so the record can be found and removed manually.
      throw new Error(
        `Delius did not return a CRN for the new offender - if it was created anyway, find it manually with: ${person.firstName} ${person.lastName}, DoB ${DeliusDateFormatter(person.dob)}, sex ${person.sex}, provider ${TEST_TEAM.provider}`,
      );
    }
    recordCreatedCrn(crn);

    // Failure here is an unpopulated allocation dropdown, which happens before the
    // transfer is submitted - so retrying the whole thing can't double-transfer.
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

  private async recoverCrnByName(
    person: ReturnType<typeof deliusPerson>,
  ): Promise<string | undefined> {
    try {
      let crn: string | undefined;
      await expect(async () => {
        // findFirstOffender also filters by sex and provider, unlike a plain
        // name search - narrows the chance of recovering an unrelated
        // offender's CRN if another record happens to share this name.
        const found = await findFirstOffender(
          this.page,
          person,
          TEST_TEAM.provider,
        );
        expect(found).toBeTruthy();
        const cleanCrn = await this.nationalSearchPage.firstResultCrn();
        // Name/sex/provider alone can still collide with an unrelated record
        // (confirmed against dev - a same-named record with a different CRN
        // topped the results), and this CRN feeds recordCreatedCrn ->
        // deleteTestOffenders, so wrongly trusting it means deleting someone
        // else's record. Cross-check DoB on the matched row before accepting it.
        const dobCell = await this.nationalSearchPage.firstResultDob();
        expect(dobCell).toBe(DeliusDateFormatter(person.dob));
        expect(cleanCrn).toBeTruthy();
        crn = cleanCrn;
      }).toPass({ timeout: 15000, intervals: [2000, 5000] });
      return crn;
    } catch (error) {
      console.log(
        `recoverCrnByName: failed to find ${person.firstName} ${person.lastName}: ${(error as Error).message}`,
      );
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
    await this.nationalSearchPage.link().click();
    await expect(this.page).toHaveTitle(/National Search/);
    await this.page.waitForLoadState("networkidle");
    await selectOption(
      this.page,
      this.nationalSearchPage.otherIdentifierSelector,
      "[Not Selected]",
    );
    await expect(async () => {
      await this.nationalSearchPage.crnInput().fill(crn);
      await expect(this.nationalSearchPage.crnInput()).toHaveValue(crn);
    }).toPass({ timeout: 10000 });
    await this.nationalSearchPage.searchButton().click();

    const viewLink = this.nationalSearchPage.viewLinkForCrn(crn);

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
    await this.offenderRecordPage.eventListLink().click();
    await this.page.waitForLoadState("networkidle");
    const eventDelete = this.offenderRecordPage.deleteEventLink();
    if ((await eventDelete.count()) > 0) {
      await eventDelete.first().click();
      await this.offenderRecordPage.confirmButton().click();
    }
    await this.offenderRecordPage.personalDetailsLink().click();
    await this.offenderRecordPage.deleteButton().click();
    await this.offenderRecordPage.confirmButton().click();
  }
}
