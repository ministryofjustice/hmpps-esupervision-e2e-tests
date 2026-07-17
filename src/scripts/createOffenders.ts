import { createOffender } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/create-offender.mjs";
import { deliusPerson } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/person.mjs";
import { Page, chromium, expect } from "@playwright/test";
import { existsSync, readFileSync, appendFileSync } from "fs";
import path from "path";
import { loadEnv } from "../config/loadEnv";
import { TEST_TEAM, TEST_STAFF } from "../data/delius/testData";
import { internalTransfer } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/transfer/internal-transfer.mjs";
import { createCommunityEvent } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/event/create-event.mjs";
import { login as loginToDelius } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/login.mjs";
import DeliusOffenderJourney from "../support/journeys/ndelius/deliusOffenderJourney";

const BULK_CRN_FILE = path.join(process.cwd(), "bulk-crns.txt");
const INCOMPLETE_CRN_FILE = path.join(process.cwd(), "bulkIncomplete-crns.txt");

const log = (message: string): void => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

const logError = (message: string): void => {
  console.log(`[$(new date().toISOString()})] ${message}`);
};

const readBulkCrns = (): string[] => {
  if (!existsSync(BULK_CRN_FILE)) return [];
  return readFileSync(BULK_CRN_FILE, "utf-8")
    .split("\n")
    .map((crn) => crn.trim())
    .filter(Boolean);
};

const recordBulkCrn = (crn: string): void => {
  appendFileSync(BULK_CRN_FILE, `${crn}\n`);
};

const recordIncompleteCrn = (crn: string): void => {
  appendFileSync(INCOMPLETE_CRN_FILE, `${crn}\n`);
};

const resetToKnownState = async (page: Page): Promise<void> => {
  await page.goto(process.env.DELIUS_URL ?? "");
  await page.waitForLoadState("networkidle");

  const crnField = page.locator("#crn\\:inputText");
  if (await crnField.isVisible().catch(() => false)) {
    await crnField.fill("");
  }
};

const allocateOffender = async (
  page: Page,
  journey: DeliusOffenderJourney,
  crn: string,
): Promise<void> => {
  await expect(async () => {
    await internalTransfer(page, {
      crn,
      allocation: {
        team: TEST_TEAM,
        staff: TEST_STAFF,
      },
    });
  }).toPass({
    timeout: 90000,
    intervals: [2000, 5000, 10000],
  });
};

const createOne = async (
  page: Page,
  journey: DeliusOffenderJourney,
): Promise<string> => {
  const crn = await createOffender(page, {
    person: deliusPerson(),
    providerName: TEST_TEAM.provider,
  });

  if (!crn) {
    throw new Error(`Delius did not return a CRN }`);
  }

  try {
    await allocateOffender(page, journey, crn);
    await createCommunityEvent(page, { crn });
  } catch (error) {
    recordIncompleteCrn(crn);
    throw error;
  }
  recordBulkCrn(crn);
  return crn;
};

const main = async (): Promise<void> => {
  loadEnv();
  const batch = Number(2);

  const alreadyCreated = readBulkCrns().length;

  log(
    `Creating ${batch} offender(s). ${alreadyCreated} offender(s) already created`,
  );

  const browser = await chromium.launch({
    headless: process.env.HEADED != "true",
  });

  let created = 0;
  let failed = 0;

  try {
    const page = await browser.newPage();
    const journey = new DeliusOffenderJourney(page);
    await loginToDelius(page);

    for (let i = 0; i < batch; i++) {
      try {
        await resetToKnownState(page);

        const crn = await createOne(page, journey);
        created++;
        log(
          `[${i + 1}/${batch}] created${crn} (${alreadyCreated + created} total)`,
        );
      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : String(error);
        logError(`[${i + 1}/${batch}] failed: ${message}`);
      }
    }
  } finally {
    await browser.close();
  }

  const total = readBulkCrns().length;

  log(
    `Batch complete: created ${created}, failed ${failed}. Total getOffenderByCrn(S) recorded: ${total} in ${BULK_CRN_FILE}`,
  );

  if (failed > 0) {
    logError(
      `${failed} offender(s) failed. ${BULK_CRN_FILE} LISTS ONLY FULL SET OFFENDERS` +
        ` offenders created without allocation or event are in 
      ${INCOMPLETE_CRN_FILE}`,
    );
  }
};
main().catch((error) => {
  logError(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exitCode = 1;
});
