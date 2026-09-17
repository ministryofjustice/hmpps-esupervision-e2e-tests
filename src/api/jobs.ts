import { assertOk, authHeader, withApiContext } from "./apiHelper";

export type JobName = "checkin-expiry";

/** Thrown when this environment has no job trigger endpoint. Retrying won't help. */
export class JobTriggersUnavailableError extends Error {}

/**
 * Kicks off a scheduled job right away instead of waiting for its cron.
 *
 * Comes back as soon as the job has started, not when it's finished - so poll
 * for whatever it was meant to do. Returns false if a run was already going.
 */
export const runJob = async (job: JobName, token: string): Promise<boolean> =>
  withApiContext<boolean>(async (ctx) => {
    const response = await ctx.post(`/v2/jobs/${job}/run`, {
      headers: authHeader(token),
    });
    // 409 means a run is already in progress. Triggers don't queue up.
    if (response.status() === 409) {
      return false;
    }
    if (response.status() === 404) {
      throw new JobTriggersUnavailableError(
        `Run job ${job} failed: 404. This environment probably doesn't have ` +
          `manual job triggers switched on - only dev and local do. ` +
          `GET /v2/jobs lists the jobs that are available here.`,
      );
    }
    await assertOk(response, `Run job ${job}`);
    return true;
  });
