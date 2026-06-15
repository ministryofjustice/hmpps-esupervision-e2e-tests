import { env } from "../config/env";
import { isoDateString, today } from "../support/utils/date";
import { assertOk, authHeader, withApiContext } from "./apiHelper";

export interface Offender {
  uuid: string;
  status: string;
}

export const getOffenderByCrn = async (
  crn: string,
  token: string,
): Promise<Offender> =>
  withApiContext<Offender>(async (ctx) => {
    const response = await ctx.get(`/v2/offenders/crn/${crn}`, {
      headers: authHeader(token),
    });
    await assertOk(response, `Get offender ${crn}`);
    return response.json();
  });

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
    const requestedBy = env.practitionerName();
    const response = await ctx.post(
      `/v2/offenders/${offenderUuid}/reactivate`,
      {
        headers: authHeader(token),
        data: {
          requestedBy,
          reason: "E2E test",
          checkInSchedule: {
            requestedBy,
            firstCheckin: opts.firstCheckin ?? isoDateString(today),
            checkinInterval: opts.checkinInterval ?? "WEEKLY",
          },
          ...(opts.contactPreference
            ? {
                contactPreference: {
                  requestedBy,
                  contactPreference: opts.contactPreference,
                },
              }
            : {}),
        },
      },
    );
    await assertOk(response, `Reactivate offender ${offenderUuid}`);
  });
