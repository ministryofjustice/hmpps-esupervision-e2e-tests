import { DateTime } from "luxon";
import { CheckinStatus, getCheckin } from "../../api/checkin";
import { JobTriggersUnavailableError, runJob } from "../../api/jobs";
import { dueDateString, today } from "./date";

// One day past the API's grace period (3 days), so the check in is old enough to
// expire without sitting on the boundary. Keep in step if that setting changes.
const DUE_DAYS_AGO = 4;
const POLL_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 2_000;
const RETRIGGER_BACKOFF_MS = 30_000;

/** A due date old enough for the expiry job to take the check in. */
export const expiredDueDate = (): string =>
  dueDateString(today.minus({ days: DUE_DAYS_AGO }));

/** The job only takes past due dates, so anything else can never expire. */
const assertDueInPast = (uuid: string, dueDate: string): void => {
  const due = DateTime.fromISO(dueDate);
  if (!due.isValid) {
    throw new Error(
      `Check in ${uuid} has an unparseable due date "${dueDate}" ` +
        `(${due.invalidReason}).`,
    );
  }
  if (due.startOf("day") >= today.startOf("day")) {
    throw new Error(
      `Check in ${uuid} is due ${dueDate}, not in the past, so no expiry run will ` +
        `take it. expiredDueDate() gives ${expiredDueDate()}.`,
    );
  }
};

/** Anything else means something outside this test moved the check in. */
const assertNotMovedUnexpectedly = (
  uuid: string,
  status: CheckinStatus,
): void => {
  if (status !== "CREATED" && status !== "EXPIRED") {
    throw new Error(
      `Check in ${uuid} is ${status}; expected CREATED or EXPIRED.`,
    );
  }
};

/**
 * Triggers the job, keeping the error rather than throwing: a bad response is a
 * refusal the caller backs off from. A missing endpoint still throws - retrying
 * cannot fix the wrong environment.
 */
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

/**
 * Gets a check in to EXPIRED without waiting for a scheduled expiry run.
 */
export const expireCheckin = async (
  uuid: string,
  token: string,
): Promise<number> => {
  const initial = await getCheckin(uuid, token);
  assertNotMovedUnexpectedly(uuid, initial.status);
  assertDueInPast(uuid, initial.dueDate);
  if (initial.status === "EXPIRED") {
    // Due date is already past the grace period, so the status read alone
    // shows EXPIRED - but the job still needs to run to produce the
    // downstream effect the UI depends on (e.g. the activity log entry).
    console.log(
      `Check in ${uuid} already expired; triggering the job so its UI effects run.`,
    );
    await tryTrigger(token);
    return Date.now();
  }

  const started = Date.now();
  let { accepted, error: triggerError } = await tryTrigger(token);
  let lastTrigger = Date.now();
  let seen: CheckinStatus = initial.status;
  console.log(
    accepted
      ? `Expiry job triggered for check in ${uuid}.`
      : `Expiry job trigger for check in ${uuid} was not accepted: ${triggerError || "a run was already in progress"}.`,
  );

  for (;;) {
    let pollError = "";
    try {
      seen = (await getCheckin(uuid, token)).status;
    } catch (error) {
      pollError = error instanceof Error ? error.message : String(error);
    }
    if (seen === "EXPIRED") {
      console.log(`Check in ${uuid} expired.`);
      return Date.now();
    }
    assertNotMovedUnexpectedly(uuid, seen);

    if (Date.now() - started > POLL_TIMEOUT_MS) {
      const waited = Math.round((Date.now() - started) / 1000);
      const runAge = Math.round((Date.now() - lastTrigger) / 1000);
      const cause = pollError
        ? `the last status read failed with ${pollError}`
        : triggerError
          ? `the last job trigger failed with ${triggerError}`
          : accepted
            ? `a run this test started ${runAge}s ago did not take it, or is still ` +
              `going. It is due ${DUE_DAYS_AGO} days ago; if the API's grace period ` +
              `is longer than that now, the check in is no longer eligible`
            : `every trigger was refused, so a run was going throughout - the job ` +
              `is slower than this window`;
      throw new Error(
        `Gave up after ${waited}s waiting for check in ${uuid} (due ${initial.dueDate}) ` +
          `to expire: ${cause}. Last status seen was ${seen}.`,
      );
    }
    if (!accepted && Date.now() - lastTrigger > RETRIGGER_BACKOFF_MS) {
      ({ accepted, error: triggerError } = await tryTrigger(token));
      lastTrigger = Date.now();
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
};
