import { expect } from "@playwright/test";
import { listOffenderCheckins } from "../../api/checkin";
import { getOffenderByCrn } from "../../api/offender";
import { env } from "../../config/env";

export const waitForAwaitingCheckinUuid = async (
  crn: string,
  token: string,
): Promise<string> => {
  const { uuid: offenderUuid } = await getOffenderByCrn(crn, token);

  let checkinUuid = "";
  await expect
    .poll(
      async () => {
        const checkins = await listOffenderCheckins(
          env.practitionerName(),
          offenderUuid,
          token,
          "AWAITING_CHECKIN",
        );
        checkinUuid = checkins[0]?.uuid ?? "";
        return checkinUuid;
      },
      {
        message: `No AWAITING_CHECKIN check in was created for ${crn}`,
        timeout: 60000,
        intervals: [2000, 5000, 10000],
      },
    )
    .not.toBe("");
  return checkinUuid;
};
