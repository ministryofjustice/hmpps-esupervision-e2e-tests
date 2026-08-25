import { getToken } from "../../api/auth";
import { getOffenderByCrn, reactivateOffender } from "../../api/offender";
import { isoDateString, today } from "./date";

/**
 * Put TEST_MPOP_STOP_RESTART_CRN back into VERIFIED with an active schedule, so
 * the restart spec repairs its own precondition rather than assuming one.
 */
export const ensureActiveCheckin = async (crn: string): Promise<string> => {
  const token = await getToken();
  const offender = await getOffenderByCrn(crn, token);
  if (offender?.status === "INACTIVE" && offender.uuid) {
    await reactivateOffender(offender.uuid, token, {
      firstCheckin: isoDateString(today.plus({ days: 7 })),
      checkinInterval: "WEEKLY",
      contactPreference: "EMAIL",
    });
  }
  return token;
};
