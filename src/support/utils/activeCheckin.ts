import { expect } from "@playwright/test";
import { getToken } from "../../api/auth";
import { getOffenderByCrn, reactivateOffender } from "../../api/offender";
import { dueDateString, isoDateString, today } from "./date";
import {
  cancelCheckin,
  createEsupervisionCheckin,
  listOffenderCheckins,
} from "../../api/checkin";
import { env } from "../../config/env";

/**
 * Reactivate the CRN if a previous run left it INACTIVE, so the stop/restart spec
 * repairs its own precondition rather than assuming one. Returns an API token for
 * the caller to reuse.
 * Reactivating with EMAIL requires an email address in NDelius - the API rejects
 * it otherwise
 */
export const ensureActiveCheckin = async (crn: string): Promise<string> => {
  let token = "";
  await expect(async () => {
    token = await getToken();
    // getOffenderByCrn throws if the CRN is not registered, which is the right
    // failure here: this spec's CRN is expected to exist.
    const offender = await getOffenderByCrn(crn, token);
    if (offender.status === "INACTIVE" && offender.uuid) {
      await reactivateOffender(offender.uuid, token, {
        firstCheckin: isoDateString(today.plus({ days: 7 })),
        checkinInterval: "WEEKLY",
        contactPreference: "EMAIL",
      });
    }
  }).toPass({ timeout: 20000, intervals: [2000, 5000, 10000] });
  return token;
};

const openCheckins = async (crn: string, token: string) => {
  const offender = await getOffenderByCrn(crn, token);
  return listOffenderCheckins(
    env.practitionerName(),
    offender.uuid,
    token,
    "AWAITING_CHECKIN",
  );
};

export const cancelOpenCheckins = async (
  crn: string,
  token: string,
  reason: string,
): Promise<void> => {
  for (const checkin of await openCheckins(crn, token)) {
    await cancelCheckin(checkin.uuid, reason, token);
  }
};

export const openNewCheckinDueToday = async (
  crn: string,
  token: string,
): Promise<string> => {
  await cancelOpenCheckins(crn, token, "E2E clean-up before cancel test");
  return createEsupervisionCheckin(crn, dueDateString(today), token);
};
