import { env } from "../config/env";
import { assertOk, authHeader, withApiContext } from "./apiHelper";

export const createEsupervisionCheckin = async (
  crn: string,
  dueDate: string,
  token: string,
): Promise<string> =>
  withApiContext<string>(async (ctx) => {
    const response = await ctx.post(`/v2/offender_checkins/crn`, {
      headers: authHeader(token),
      data: { practitioner: env.practitionerName(), offender: crn, dueDate },
    });
    await assertOk(response, `Create checkin for ${crn}`);
    return (await response.json()).uuid;
  });

export interface CheckinSummary {
  uuid: string;
  crn: string;
  status: string;
  dueDate: string;
  createdBy: string;
}

export type CheckinUseCase =
  | "AWAITING_CHECKIN"
  | "NEEDS_ATTENTION"
  | "REVIEWED";

export const listOffenderCheckins = async (
  practitioner: string,
  offenderUuid: string,
  token: string,
  useCase?: CheckinUseCase,
): Promise<CheckinSummary[]> =>
  withApiContext<CheckinSummary[]>(async (ctx) => {
    const response = await ctx.get(`/v2/offender_checkins`, {
      headers: authHeader(token),
      params: {
        practitioner,
        offenderId: offenderUuid,
        direction: "DESC",
        ...(useCase ? { useCase } : {}),
      },
    });
    await assertOk(response, `List checkins for offender ${offenderUuid}`);
    const body = (await response.json()) as { content?: CheckinSummary[] };
    return body.content ?? [];
  });
