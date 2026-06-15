import { env } from "../config/env";
import { isoDateString, today } from "../support/utils/date";
import { assertOk, authHeader, withApiContext } from "./apiHelper";

export const getOffenderByCrn = async (crn: string, token: string) =>
  withApiContext(async (ctx) => {
    const response = await ctx.get(`/v2/offenders/crn/${crn}`, {
      headers: authHeader(token),
    });
    await assertOk(response, `Get offender ${crn}`);
    return response.json();
  });

export const getOffenderUuidByCrn = async (
  crn: string,
  token: string,
): Promise<string | null> => {
  const offender = await getOffenderByCrn(crn, token);
  return (offender?.uuid as string) ?? null;
};

export interface CheckinScheduleOpts {
  firstCheckin?: string;
  checkinInterval?: string;
  contactPreference?: "PHONE" | "EMAIL";
}

export const reactivateOffender = async (
  offenderUuid: string,
  token: string,
  opts: CheckinScheduleOpts = {},
): Promise<void> =>
  withApiContext(async (ctx) => {
    const response = await ctx.post(
      `/v2/offenders/${offenderUuid}/reactivate`,
      {
        headers: authHeader(token),
        data: {
          requestedBy: env.practitionerName(),
          reason: "E2E test",
          checkInSchedule: {
            requestedBy: env.practitionerName(),
            firstCheckin: opts.firstCheckin ?? isoDateString(today),
            checkinInterval: opts.checkinInterval ?? "WEEKLY",
          },
          ...(opts.contactPreference
            ? {
                contactPreference: {
                  requestedBy: env.practitionerName(),
                  contactPreference: opts.contactPreference,
                },
              }
            : {}),
        },
      },
    );
    await assertOk(response, `Reactivate offender ${offenderUuid}`);
  });
