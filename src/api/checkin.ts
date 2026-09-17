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

export type CheckinStatus =
  "CREATED" | "SUBMITTED" | "REVIEWED" | "EXPIRED" | "CANCELLED";

/** The fields every check in has, whichever endpoint it came from. */
interface CheckinBase {
  uuid: string;
  crn: string;
  status: CheckinStatus;
  dueDate: string;
}

export interface CheckinSummary extends CheckinBase {
  createdBy: string;
}

export interface Checkin extends CheckinBase {
  reviewedAt: string | null;
}

export const getCheckin = async (
  uuid: string,
  token: string,
): Promise<Checkin> =>
  withApiContext<Checkin>(async (ctx) => {
    const response = await ctx.get(`/v2/offender_checkins/${uuid}`, {
      headers: authHeader(token),
    });
    await assertOk(response, `Get checkin ${uuid}`);
    return (await response.json()) as Checkin;
  });

export type CheckinUseCase =
  "AWAITING_CHECKIN" | "NEEDS_ATTENTION" | "REVIEWED";

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

// Removes every question assigned to a CRN's upcoming check in. Used both as
// teardown and as a precondition, because the Add question button disappears at
// MAX_CUSTOM_QUESTIONS.
export const deleteAssignedQuestions = async (
  crn: string,
  token: string,
): Promise<void> =>
  withApiContext(async (ctx) => {
    const response = await ctx.delete(`/v2/questions/assignment`, {
      headers: authHeader(token),
      params: { crn },
    });
    await assertOk(response, `Delete assigned questions for ${crn}`);
  });
