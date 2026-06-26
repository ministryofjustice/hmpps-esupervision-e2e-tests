import { chromium } from "@playwright/test";
import { getToken } from "../api/auth";
import { getOffenderByCrn, deactivateOffender } from "../api/offender";
import DeliusOffenderJourney from "../support/journeys/ndelius/deliusOffenderJourney";
import {
  readCreatedCrns,
  writeCreatedCrns,
} from "../support/utils/createdCrns";
import { loadEnv } from "../config/loadEnv";

loadEnv();

const fromEnv = (process.env.CRNS ?? "")
  .split(",")
  .map((crn) => crn.trim())
  .filter(Boolean);

const deactivateAll = async (crns: string[]): Promise<void> => {
  let token: string;
  try {
    token = await getToken();
  } catch (error) {
    console.log(
      `Skipping deactivation (no token) :${(error as Error).message}`,
    );
    return;
  }

  for (const crn of crns) {
    try {
      const offender = await getOffenderByCrn(crn, token);
      if (offender?.status === "VERIFIED" && offender.uuid) {
        await deactivateOffender(offender.uuid, token);
        console.log(`Deactivated offender ${crn}`);
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

const main = async (): Promise<void> => {
  const crns = fromEnv.length > 0 ? fromEnv : readCreatedCrns();
  if (crns.length === 0) {
    console.log("No CRNs to clean up");
    return;
  }

  await deactivateAll(crns);
  const failed = await deleteAll(crns);
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
