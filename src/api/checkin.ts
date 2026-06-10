import { expect, request } from "@playwright/test";
import { env } from "../config/env";

export const createEsupervisionCheckin = async (
  crn: string,
  dueDate: string,
  token: string,
): Promise<string> => {
  const context = await request.newContext({
    baseURL: env.esupervisionApiUrl(),
  });
  try {
    const response = await context.post(`/v2/offender_checkins/crn`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { practitioner: env.practitionerName(), offender: crn, dueDate },
    });
    if (!response.ok()) {
      expect(
        response.ok(),
        `Create checkin failed for ${crn}: ${response.status()} ${await response.text()}`,
      ).toBeTruthy();
    }
    const body = await response.json();
    return body.uuid;
  } finally {
    await context.dispose();
  }
};
