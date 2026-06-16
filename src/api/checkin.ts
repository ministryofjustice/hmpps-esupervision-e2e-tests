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
