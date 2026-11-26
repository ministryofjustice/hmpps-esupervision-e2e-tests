import { expect, Page, test } from "@playwright/test";
import { DateTime } from "luxon";
import {
  findCustodyForEventByCRN,
  findEventByCRN,
} from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/event/find-events.mjs";
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
import type { ExistingTier } from "../../../data/models";
import { attachCreatedCrn, recordCreatedCrn } from "../../utils/createdCrns";
import {
  dismissModals,
  findFirstOffender,
  findOffenderByCRN,
} from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/find-offender.mjs";
import { selectOption } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/inputs.mjs";
import {
  DeliusDateFormatter,
  Yesterday,
} from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/date-time.mjs";
import NationalSearchPage from "../../pages/ndelius/nationalSearchPage";
import OffenderRecordPage from "../../pages/ndelius/offenderRecordPage";

export type OffenderProfile = "custodialAge25" | "highRiskAge25" | "tierCAge25";

export type RoshRegisterType =
  "Low RoSH" | "Medium RoSH" | "High RoSH" | "Very High RoSH";

export interface CreatedDeliusOffender extends NewOffender {
  deliusPerson: Person;
  convictionDate: Date;
  expectedTier?: ExistingTier;
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
  expectedTier: ExistingTier;
}

/** Offender profiles for E2E scenarios. Each produces a different tier after OASys assessment.
 *  - custodialAge25: Standard profile → Tier G (general)
 *  - highRiskAge25: High RoSH + sexual offence → Tier A (high risk)
 *  - tierCAge25: Sexual offence without current motivations → Tier C
 */
const OFFENDER_PROFILES: Record<OffenderProfile, OffenderProfileConfig> = {
  custodialAge25: {
    expectedTier: "G",
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
    expectedTier: "A",
    person: {
      sex: "Male",
      dob: DateTime.now().minus({ years: 25 }).toJSDate(),
    },
  },
  tierCAge25: {
    expectedTier: "C",
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
    convictionDate = Yesterday.toJSDate(),
  }: {
    profile?: OffenderProfile;
    convictionDate?: Date;
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
    // Attach before setup so failures retain this CRN for investigation.
    await attachCreatedCrn(test.info(), crn);

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
      expectedTier: profileConfig?.expectedTier,
      person: {
        firstName: person.firstName,
        lastName: person.lastName,
        dob: person.dob,
      },
    };
  }

  async recordFinalThirdDate(crn: string, date: Date): Promise<void> {
    await test.step("Record the final-third Throughcare date in Delius", async () => {
      await findCustodyForEventByCRN(this.page, crn, 1);
      await this.page
        .getByRole("button", { name: "T/C Dates", exact: true })
        .click();
      await expect(this.page).toHaveTitle(/Maintain Throughcare Dates/);

      const type = this.page.locator(
        '[id="throughcareDateType:selectOneMenu"]',
      );
      const option = type.locator("option").filter({ hasText: /final third/i });
      await expect(
        option,
        "Delius must offer the final-third date type",
      ).toHaveCount(1);
      const value = await option.getAttribute("value");
      expect(value, "The final-third date type must have a value").toBeTruthy();
      await type.selectOption(value!);
      const formatted = DeliusDateFormatter(date);
      await this.page
        .locator('[id="throughcareDate:datePicker"]')
        .fill(formatted);
      await this.page
        .getByRole("button", { name: "Add/Update", exact: true })
        .click();
      await expect(
        this.page
          .locator("#throughcaredatesTable tr")
          .filter({ hasText: /final third/i }),
      ).toContainText(formatted);
      await this.page
        .getByRole("button", { name: "Save", exact: true })
        .click();
      await expect(this.page).toHaveTitle(/Throughcare Details/);
      // Re-open the form to verify the date was persisted, not just added to the draft.
      await this.page
        .getByRole("button", { name: "T/C Dates", exact: true })
        .click();
      await expect(this.page).toHaveTitle(/Maintain Throughcare Dates/);
      await expect(
        this.page
          .locator("#throughcaredatesTable tr")
          .filter({ hasText: /final third/i }),
      ).toContainText(formatted);
      await this.page
        .getByRole("button", { name: "Save", exact: true })
        .click();
      await expect(this.page).toHaveTitle(/Throughcare Details/);
    });
  }

  /**
   * Records a standard recall through Throughcare's **Add Return To Custody**
   * form, leaving custody status Recalled (C).
   *
   * Delius sets Recalled only when the person is recalled but not held: a
   * prison as the location gives In Custody (D) instead, which eSupervision
   * does not report as recalled. Unlawfully at Large also gives Recalled, but
   * eSupervision excludes it, so the default location is "Unknown".
   */
  async recordRecall(
    crn: string,
    date: Date,
    { location = "Unknown" }: { location?: string } = {},
  ): Promise<void> {
    await test.step(`Record a recall to custody for ${crn} in Delius`, async () => {
      await findEventByCRN(this.page, crn, 1);
      await this.page.getByRole("button", { name: "Throughcare" }).click();
      await expect(this.page.locator("h1")).toContainText(
        "Throughcare Details",
      );
      await this.page
        .getByRole("button", { name: "Add Return To Custody", exact: true })
        .click();
      await expect(this.page).toHaveTitle(/Add Return To Custody/);

      const formatted = DeliusDateFormatter(date);
      await this.page
        .locator('[id="statusChangeDate:datePicker"]')
        .fill(formatted);
      await selectOption(
        this.page,
        "#status\\:selectOneMenu",
        "Standard Recall",
      );
      await selectOption(this.page, "#location\\:selectOneMenu", location);
      await this.page
        .getByRole("button", { name: "Save", exact: true })
        .click();
      // Delius warns that licence conditions will be auto-terminated and
      // only saves the return to custody once that is confirmed.
      await expect(this.page.getByText("Select Confirm to save")).toBeVisible();
      await this.page
        .getByRole("button", { name: "Confirm", exact: true })
        .click();
      await expect(this.page).not.toHaveTitle(/Add Return To Custody/);

      await findEventByCRN(this.page, crn, 1);
      await this.page.getByRole("button", { name: "Throughcare" }).click();
      const details = this.page.locator("form").filter({
        hasText: "THROUGHCARE DETAILS",
      });
      await expect(details, "Custody status should be Recalled").toContainText(
        /Current Status:\s*Recalled/,
      );
      await expect(details).toContainText(
        new RegExp(
          `Current Location:\\s*${location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        ),
      );
      await expect(details).toContainText(formatted);
    });
  }

  /**
   * Adds a RoSH registration unless the case already has a current one.
   *
   * Tier marks a case provisional when it has no RoSH (and no MAPPA) registration
   * and would otherwise be below Tier C. Supervision Packages treats a provisional
   * tier as "not yet known" (SPNK), so the case gets no package. OASys sign-and-lock
   * normally creates this registration, but it does not always arrive. Adding it
   * publishes probation-case.registration.added, which makes both Tier and
   * Supervision Packages recalculate the case.
   */
  async ensureRoshRegistration(
    crn: string,
    registerType: RoshRegisterType = "Low RoSH",
  ): Promise<void> {
    await test.step(`Ensure ${crn} has a RoSH registration`, async () => {
      // Callers usually arrive from OASys, so sign in to Delius first.
      await loginToDelius(this.page);
      await findOffenderByCRN(this.page, crn);
      await this.page.locator("a", { hasText: "Personal Details" }).click();
      await this.page.locator("a", { hasText: "Registration Summary" }).click();
      await expect(this.page).toHaveTitle("Register Summary");

      // Only the CURRENT REGISTRATIONS table has this id; history is separate.
      const currentRosh = this.page
        .locator("#registrationTable tbody tr")
        .filter({ hasText: /\bRoSH\b/ });
      if ((await currentRosh.count()) > 0) {
        console.log(`${crn} already has a current RoSH registration`);
        return;
      }

      await this.page.locator("input", { hasText: "Add Registration" }).click();
      await expect(this.page).toHaveTitle("Add Registration");
      await selectOption(
        this.page,
        "#Trust\\:selectOneMenu",
        TEST_TEAM.provider,
      );
      await selectOption(
        this.page,
        "#RegisterType\\:selectOneMenu",
        registerType,
      );
      await selectOption(this.page, "#Team\\:selectOneMenu");
      await selectOption(this.page, "#Staff\\:selectOneMenu");
      await this.page.locator("input", { hasText: "Save" }).click();
      await expect(this.page).toHaveTitle("Register Summary");
      await expect(
        this.page.locator("#registrationTable tbody tr").filter({
          hasText: registerType,
        }),
      ).toHaveCount(1);
    });
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
          // "No records found" confirms the CRN is gone (e.g. deleted on an earlier run)
          if (await this.nationalSearchPage.noRecordsMessage().isVisible()) {
            console.log(`${crn} is not in NDelius - already deleted`);
            continue;
          }
          notDeleted.push(crn);
          console.log(`No record found for ${crn} - skipping`);
          continue;
        }
        await this.deleteCurrentOffender();
        if (await this.openOffenderForDeletion(crn)) {
          throw new Error(`${crn} is still in NDelius after delete`);
        }
        if (!(await this.nationalSearchPage.noRecordsMessage().isVisible())) {
          throw new Error(`Could not confirm ${crn} was deleted in NDelius`);
        }
      } catch (error) {
        notDeleted.push(crn);
        console.log(`Failed to delete ${crn}: ${(error as Error).message}`);
      }
    }

    return notDeleted;
  }

  async openOffenderForDeletion(crn: string): Promise<boolean> {
    await this.nationalSearchPage.link().click();
    await expect(this.page).toHaveTitle(/National Search/, { timeout: 30000 });
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
    // Wait for the search to finish - either the CRN's row or "No records found"
    // so a missing CRN returns straight away instead of after the full timeout.
    const found = await viewLink
      .or(this.nationalSearchPage.noRecordsMessage())
      .first()
      .waitFor({ state: "visible", timeout: 15000 })
      .then(() => viewLink.isVisible())
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
