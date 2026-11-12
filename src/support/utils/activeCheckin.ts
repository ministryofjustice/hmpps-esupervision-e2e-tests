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

const checkinDueToday = async (
  crn: string,
  token: string,
): Promise<string | undefined> => {
  const offender = await getOffenderByCrn(crn, token);
  const open = await listOffenderCheckins(
    env.practitionerName(),
    offender.uuid,
    token,
    "AWAITING_CHECKIN",
  );
  return open.find((c) => c.dueDate === today.toISODate())?.uuid;
};

export const ensureCheckinDueToday = async (
  crn: string,
  token: string,
): Promise<string> =>
  (await checkinDueToday(crn, token)) ??
  (await createEsupervisionCheckin(crn, dueDateString(today), token));

export const cancelCheckinDueToday = async (
  crn: string,
  token: string,
): Promise<void> => {
  const uuid = await checkinDueToday(crn, token);
  if (uuid) {
    await cancelCheckin(uuid, "E2E clean-up after a failed run", token);
  }
};
