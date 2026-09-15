import { listOffenderCheckins } from "../../api/checkin";
import { env } from "../../config/env";

export interface PoolCheckin {
  crn: string;
  uuid: string;
}

/**
 * Borrow an already-missed check in from the environment's own recurring seed
 * data, rather than creating one - a check in can't be backdated old enough
 * to expire, so only real elapsed time can produce one.
 *
 * Doesn't trigger the expiry job itself. Returns undefined if nothing is
 * EXPIRED yet, so the caller can skip the test instead of failing it.
 */
export const pickExpiredCheckinFromPool = async (
  token: string,
): Promise<PoolCheckin | undefined> => {
  const needsAttention = await listOffenderCheckins(
    env.practitionerName(),
    undefined,
    token,
    "NEEDS_ATTENTION",
  );

  const expired = needsAttention.find(
    (candidate) => candidate.status === "EXPIRED",
  );
  if (!expired) {
    console.log(
      `[missedCheckin] no EXPIRED check in among ${needsAttention.length}` +
        " NEEDS_ATTENTION candidates - skipping",
    );
    return undefined;
  }

  console.log(
    `[missedCheckin] picked CRN ${expired.crn} (checkin ${expired.uuid})` +
      ` from ${needsAttention.length} NEEDS_ATTENTION candidates`,
  );
  return { crn: expired.crn, uuid: expired.uuid };
};
