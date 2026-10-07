import { expect } from "@playwright/test";
import { getCheckin, listOffenderCheckins } from "../../api/checkin";
import { JobTriggersUnavailableError, runJob } from "../../api/jobs";
import { env } from "../../config/env";
import { getOffenderByCrn } from "../../api/offender";
import { dueDateString, today } from "./date";

const DUE_DAYS_AGO = 4;
const DEFAULT_POLL_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 2_000;
const RETRIGGER_BACKOFF_MS = 30_000;

export const expiredDueDate = (): string =>
  dueDateString(today.minus({ days: DUE_DAYS_AGO }));

const assertNotMovedUnexpectedly = (uuid: string, status: string): void => {
  if (status !== "CREATED" && status !== "EXPIRED") {
    throw new Error(
      `Check in ${uuid} is ${status}; expected CREATED or EXPIRED.`,
    );
  }
};

const tryTrigger = async (
  token: string,
): Promise<{ accepted: boolean; error: string }> => {
  try {
    return { accepted: await runJob("checkin-expiry", token), error: "" };
  } catch (error) {
    if (error instanceof JobTriggersUnavailableError) throw error;
    return {
      accepted: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const expireCheckin = async (
  crn: string,
  uuid: string,
  token: string,
  { timeoutMs = DEFAULT_POLL_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<void> => {
  const offender = await getOffenderByCrn(crn, token);
  const listCheckins = (useCase: "AWAITING_CHECKIN" | "NEEDS_ATTENTION") =>
    listOffenderCheckins(env.practitionerName(), offender.uuid, token, useCase);
  const initial = await getCheckin(uuid, token);
  assertNotMovedUnexpectedly(uuid, initial.status);

  let { accepted, error: triggerError } = await tryTrigger(token);
  let lastTrigger = Date.now();

  let lastStatus = initial.status;
  let isAwaiting = true;
  let needsReview = false;
  let lastPollError = "";
  try {
    await expect
      .poll(
        async () => {
          try {
            lastStatus = (await getCheckin(uuid, token)).status;
            lastPollError = "";
          } catch (error) {
            lastPollError =
              error instanceof Error ? error.message : String(error);
            return false;
          }
          assertNotMovedUnexpectedly(uuid, lastStatus);
          if (lastStatus !== "EXPIRED") {
            if (!accepted && Date.now() - lastTrigger >= RETRIGGER_BACKOFF_MS) {
              ({ accepted, error: triggerError } = await tryTrigger(token));
              lastTrigger = Date.now();
            }
            return false;
          }

          try {
            const [awaiting, needsAttention] = await Promise.all([
              listCheckins("AWAITING_CHECKIN"),
              listCheckins("NEEDS_ATTENTION"),
            ]);
            isAwaiting = awaiting.some((item) => item.uuid === uuid);
            needsReview = needsAttention.some((item) => item.uuid === uuid);
          } catch (error) {
            lastPollError =
              error instanceof Error ? error.message : String(error);
            return false;
          }
          if (needsReview && !isAwaiting) return true;
          return false;
        },
        {
          message: `${uuid} should expire and move from AWAITING_CHECKIN to NEEDS_ATTENTION`,
          timeout: timeoutMs,
          intervals: [POLL_INTERVAL_MS],
        },
      )
      .toBe(true);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Expiry transition failed for ${uuid} (due ${initial.dueDate}). ` +
        `Last status: ${lastStatus}; job accepted: ${accepted}; ` +
        `awaiting: ${isAwaiting}; needs attention: ${needsReview}; ` +
        `trigger error: ${triggerError}; read error: ${lastPollError}. ${reason}`,
      { cause: error },
    );
  }
};
