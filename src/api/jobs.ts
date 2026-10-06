import { assertOk, authHeader, withApiContext } from "./apiHelper";

export type JobName = "checkin-expiry";

export class JobTriggersUnavailableError extends Error {}

export const assertJobAvailable = async (
  job: JobName,
  token: string,
): Promise<void> =>
  withApiContext<void>(async (ctx) => {
    const response = await ctx.get("/v2/jobs", {
      headers: authHeader(token),
    });
    if (response.status() === 404) {
      throw new JobTriggersUnavailableError(
        "Manual job triggers are unavailable in this environment.",
      );
    }
    await assertOk(response, "List available jobs");
    const { jobs } = (await response.json()) as { jobs: string[] };
    if (!jobs.includes(job)) {
      throw new JobTriggersUnavailableError(
        `Job ${job} is unavailable in this environment.`,
      );
    }
  });

export const runJob = async (job: JobName, token: string): Promise<boolean> =>
  withApiContext<boolean>(async (ctx) => {
    const response = await ctx.post(`/v2/jobs/${job}/run`, {
      headers: authHeader(token),
    });
    if (response.status() === 409) {
      return false;
    }
    if (response.status() === 404) {
      throw new JobTriggersUnavailableError(
        `Run job ${job} failed: 404. Manual job triggers are only available in dev and local environments.`,
      );
    }
    if (response.status() !== 202) {
      throw new Error(
        `Run job ${job} returned ${response.status()}; expected 202 Accepted.`,
      );
    }
    await assertOk(response, `Run job ${job}`);
    return true;
  });
