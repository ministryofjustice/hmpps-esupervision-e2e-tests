import { chromium } from "@playwright/test";
import { getToken } from "../api/auth";
import {
  deactivateOffender,
  deleteOffenderRecord,
  findOffenderByCrn,
} from "../api/offender";
import DeliusOffenderJourney from "../support/journeys/ndelius/deliusOffenderJourney";
import {
  readCreatedCrns,
  writeCreatedCrns,
} from "../support/utils/createdCrns";
import { loadEnv } from "../config/loadEnv";

const findToken = async (): Promise<string | undefined> => {
  try {
    return await getToken();
  } catch (error) {
    console.log(`Failed to get token: ${(error as Error).message}`);
    return undefined;
  }
};

const deactivateAll = async (crns: string[], token: string): Promise<void> => {
  for (const crn of crns) {
    try {
      const offender = await findOffenderByCrn(crn, token);
      if (offender?.status === "VERIFIED" && offender.uuid) {
        await deactivateOffender(offender.uuid, token);
        console.log(`Deactivated offender ${crn}`);
      } else if (!offender) {
        console.log(`Skipped ${crn}: not registered with the API`);
      } else {
        console.log(
          `Skipped ${crn}: status ${offender.status}, not VERIFIED - likely a setup that failed part way`,
        );
      }
    } catch (error) {
      console.log(`Failed to deactivate ${crn}: ${(error as Error).message}`);
    }
  }
};

const deleteAll = async (crns: string[]): Promise<string[]> => {
  const headed = process.env.HEADED === "true";
  const browser = await chromium.launch({
    headless: !headed,
  });
  try {
    const page = await browser.newPage();
    return await new DeliusOffenderJourney(page).deleteTestOffenders(crns);
  } finally {
    await browser.close();
  }
};

const deleteCheckinRecords = async (
  crns: string[],
  token: string,
): Promise<string[]> => {
  const failed: string[] = [];
  for (const crn of crns) {
    try {
      await deleteOffenderRecord(crn, token);
      console.log(`Deleted check-in records for ${crn}`);
    } catch (error) {
      console.log(
        `Failed to delete check-in records for ${crn}: ${(error as Error).message}`,
      );
      failed.push(crn);
      console.log(
        `Failed to delete check-in records for ${crn}: ${(error as Error).message}`,
      );
    }
  }
  return failed;
};

// Imported by e2e teardown
export const cleanupCrns = async (crns: string[]): Promise<string[]> => {
  if (crns.length === 0) return [];
  const token = await findToken();
  if (token) await deactivateAll(crns, token);
  const deliusFailed = await deleteAll(crns);
  const apiFailed = token ? await deleteCheckinRecords(crns, token) : crns;
  return [...deliusFailed, ...apiFailed];
};

// Run as a script - not when imported by a test
if (process.argv[1]?.includes("cleanupCrns")) {
  loadEnv();
  const fromEnv = (process.env.CRNS ?? "")
    .split(",")
    .map((crn) => crn.trim())
    .filter(Boolean);
  const main = async (): Promise<void> => {
    const crns = fromEnv.length > 0 ? fromEnv : readCreatedCrns();
    if (crns.length === 0) {
      console.log("No CRNs to clean up");
      return;
    }

    const failed = await cleanupCrns(crns);
    if (fromEnv.length === 0) {
      writeCreatedCrns(failed);
    }

    if (failed.length > 0) {
      console.log(
        `could not delete ${failed.length} offender(s): ${failed.join(",")}`,
      );
      process.exitCode = 1;
    }
  };

  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
