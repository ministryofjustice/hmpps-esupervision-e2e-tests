import { expect, Page } from "@playwright/test";
import { DateTime } from "luxon";
import { login as loginToDelius } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/login.mjs";
import { deliusPerson } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/person.mjs";
import { createOffender } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/create-offender.mjs";
import {
  createCommunityEvent,
  createEvent,
} from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/event/create-event.mjs";
import { internalTransfer } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/transfer/internal-transfer.mjs";
import { TEST_TEAM, TEST_STAFF } from "../../../data/delius/testData";
import { NewOffender, Person } from "../../../data/delius/types";
import { recordCreatedCrn } from "../../utils/createdCrns";
import {
  dismissModals,
  findFirstOffender,
} from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/find-offender.mjs";
import { selectOption } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/inputs.mjs";
import {
  DeliusDateFormatter,
  Yesterday,
} from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/date-time.mjs";
import NationalSearchPage from "../../pages/ndelius/nationalSearchPage";
import OffenderRecordPage from "../../pages/ndelius/offenderRecordPage";

export type OffenderProfile = "custodialAge25" | "highRiskAge25" | "tierCAge25";

export interface CreatedDeliusOffender extends NewOffender {
  deliusPerson: Person;
  convictionDate: Date;
}

interface DeliusEventProfile {
  appearanceType: string;
  outcome: string;
  length?: string;
  mainOffence?: string;
  subOffence?: string;
  plea?: string;
}

interface OffenderProfileConfig {
  person?: { sex: "Male" | "Female"; dob: Date };
  event?: DeliusEventProfile;
}

/** Offender profiles for E2E scenarios. Each produces a different tier after OASys assessment.
 *  - custodialAge25: Standard profile → Tier G (general)
 *  - highRiskAge25: High RoSH + sexual offence → Tier A (high risk)
 *  - tierCAge25: Sexual offence without current motivations → Tier C
 */
const OFFENDER_PROFILES: Record<OffenderProfile, OffenderProfileConfig> = {
  custodialAge25: {
    person: {
      sex: "Female",
      dob: DateTime.now().minus({ years: 25 }).toJSDate(),
    },
    event: {
      appearanceType: "Sentence",
      outcome: "Adult Custody < 12m",
      length: "6",
      mainOffence: "Stealing by an employee - 04100",
      subOffence: "Stealing by an employee - 04100",
      plea: "Guilty",
    },
  },
  highRiskAge25: {
    person: {
      sex: "Male",
      dob: DateTime.now().minus({ years: 25 }).toJSDate(),
    },
  },
  tierCAge25: {
    person: {
      sex: "Male",
      dob: DateTime.now().minus({ years: 25 }).toJSDate(),
    },
    event: {
      appearanceType: "Sentence",
      outcome: "SA2020 Community Order",
      length: "6",
      mainOffence: "Stealing by an employee - 04100",
      subOffence: "Stealing by an employee - 04100",
    },
  },
};

export default class DeliusOffenderJourney {
  private readonly nationalSearchPage: NationalSearchPage;
  private readonly offenderRecordPage: OffenderRecordPage;

  constructor(private readonly page: Page) {
    this.nationalSearchPage = new NationalSearchPage(page);
    this.offenderRecordPage = new OffenderRecordPage(page);
  }

  async createTestOffender({
    profile,
  }: {
    profile?: OffenderProfile;
  } = {}): Promise<CreatedDeliusOffender> {
    const profileConfig = profile ? OFFENDER_PROFILES[profile] : undefined;
    const person = deliusPerson(profileConfig?.person);
    const provider = TEST_TEAM.provider;
    await loginToDelius(this.page);
    let crn: string | undefined = await createOffender(this.page, {
      person,
      providerName: provider,
    });
    if (!crn) {
      // createOffender may have succeeded despite returning no CRN,
      // so recover by name instead of retrying (which could create a duplicate).
      crn = await this.recoverCrnByName(person, provider);
    }
    if (!crn) {
      // Creation may still have gone through even though nothing got recorded for
      // cleanup - print identifying details so the record can be found and removed manually.
      throw new Error(
        `Delius did not return a CRN for the new offender - if it was created anyway, find it manually with: ${person.firstName} ${person.lastName}, DoB ${DeliusDateFormatter(person.dob)}, sex ${person.sex}, provider ${provider}`,
      );
    }
    recordCreatedCrn(crn);

    const convictionDate = Yesterday.toJSDate();
    // Failure here is an unpopulated allocation dropdown, which happens before the
    // transfer is submitted - so retrying the whole thing can't double-transfer.
    await expect(async () => {
      await internalTransfer(this.page, {
        crn,
        allocation: { team: TEST_TEAM, staff: TEST_STAFF },
      });
    }).toPass({ timeout: 20000, intervals: [2000, 5000, 10000] });
    if (!profileConfig?.event) {
      await createCommunityEvent(this.page, {
        crn,
        date: convictionDate,
      });
    } else {
      await expect(this.offenderRecordPage.caseSummary()).toContainText(
        TEST_TEAM.name,
      );
      await expect(this.offenderRecordPage.caseSummary()).toContainText(
        TEST_STAFF.lastName,
      );
      await createEvent(this.page, {
        crn,
        allocation: { team: TEST_TEAM, staff: TEST_STAFF },
        date: convictionDate,
        event: profileConfig.event,
      });
    }
    return {
      crn,
      deliusPerson: person,
      convictionDate,
      person: {
        firstName: person.firstName,
        lastName: person.lastName,
        dob: person.dob,
      },
    };
  }

  private async recoverCrnByName(
    person: ReturnType<typeof deliusPerson>,
    provider: string,
  ): Promise<string | undefined> {
    try {
      let crn: string | undefined;
      await expect(async () => {
        // findFirstOffender also filters by sex and provider, unlike a plain
        // name search - narrows the chance of recovering an unrelated
        // offender's CRN if another record happens to share this name.
        const hasResults = await findFirstOffender(this.page, person, provider);
        expect(hasResults).toBeTruthy();
        // Name/sex/provider alone can still collide with another record, so
        // match on DOB too rather than trusting the first row - this CRN
        // feeds into deleteTestOffenders later on.
        const matchedCrn = await this.nationalSearchPage.findCrnByDob(
          DeliusDateFormatter(person.dob),
        );
        expect(matchedCrn).toBeTruthy();
        crn = matchedCrn;
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
      await this.page.waitForLoadState("networkidle");
    }
    await expect(this.offenderRecordPage.personalDetailsLink()).toBeVisible();
    await this.offenderRecordPage.personalDetailsLink().click();
    await this.page.waitForLoadState("networkidle");
    await this.offenderRecordPage.deleteButton().click();
    await this.offenderRecordPage.confirmButton().click();
    await expect(this.nationalSearchPage.link()).toBeVisible({
      timeout: 15000,
    });
  }
}
