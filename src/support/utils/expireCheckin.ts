import { DateTime } from "luxon";
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

const assertDueInPast = (uuid: string, dueDate: string): void => {
  const due = DateTime.fromISO(dueDate);
  if (!due.isValid) {
    throw new Error(
      `Check in ${uuid} has an unparseable due date "${dueDate}" (${due.invalidReason}).`,
    );
  }
  if (due.startOf("day") >= today.startOf("day")) {
    throw new Error(
      `Check in ${uuid} is due ${dueDate}, not in the past, so no expiry run will take it.`,
    );
  }
};

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
): Promise<number> => {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("Expiry polling timeout must be a positive finite number.");
  }
  const offender = await getOffenderByCrn(crn, token);
  const listCheckins = (useCase: "AWAITING_CHECKIN" | "NEEDS_ATTENTION") =>
    listOffenderCheckins(env.practitionerName(), offender.uuid, token, useCase);
  const initial = await getCheckin(uuid, token);
  assertNotMovedUnexpectedly(uuid, initial.status);
  assertDueInPast(uuid, initial.dueDate);
  const awaitingBeforeTrigger = await listCheckins("AWAITING_CHECKIN");
  if (!awaitingBeforeTrigger.some((checkin) => checkin.uuid === uuid)) {
    throw new Error(
      `Check in ${uuid} was not in AWAITING_CHECKIN before triggering expiry.`,
    );
  }
  const needsAttentionBeforeTrigger = await listCheckins("NEEDS_ATTENTION");
  if (needsAttentionBeforeTrigger.some((checkin) => checkin.uuid === uuid)) {
    throw new Error(
      `Check in ${uuid} was already in NEEDS_ATTENTION before triggering expiry.`,
    );
  }

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
          if (!accepted && Date.now() - lastTrigger >= RETRIGGER_BACKOFF_MS) {
            ({ accepted, error: triggerError } = await tryTrigger(token));
            lastTrigger = Date.now();
          }
          try {
            const [checkin, awaiting, needsAttention] = await Promise.all([
              getCheckin(uuid, token),
              listCheckins("AWAITING_CHECKIN"),
              listCheckins("NEEDS_ATTENTION"),
            ]);
            lastStatus = checkin.status;
            isAwaiting = awaiting.some((item) => item.uuid === uuid);
            needsReview = needsAttention.some((item) => item.uuid === uuid);
            lastPollError = "";
          } catch (error) {
            lastPollError =
              error instanceof Error ? error.message : String(error);
            return false;
          }
          assertNotMovedUnexpectedly(uuid, lastStatus);
          return (
            accepted && lastStatus === "EXPIRED" && needsReview && !isAwaiting
          );
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

  return Date.now();
};
