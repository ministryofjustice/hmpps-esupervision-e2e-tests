import { getToken } from "../../api/auth";
import { getOffenderByCrn, reactivateOffender } from "../../api/offender";
import { isoDateString, today } from "./date";

/**
 * Reactivate the CRN if a previous run left it INACTIVE, so the stop/restart spec
 * repairs its own precondition rather than assuming one. Returns an API token for
 * the caller to reuse.
 * Reactivating with EMAIL requires an email address in NDelius - the API rejects
 * it otherwise
 */
export const ensureActiveCheckin = async (crn: string): Promise<string> => {
  const token = await getToken();
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
  return token;
};
