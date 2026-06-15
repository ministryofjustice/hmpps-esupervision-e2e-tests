import { expect, request } from "@playwright/test";
import { env } from "../config/env";
import { isoDateString, today } from "../support/utils/date";

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

export const getOffenderByCrn = async (
  crn: string,
  token: string,
): Promise<Record<string, unknown> | null> => {
  const context = await request.newContext({
    baseURL: env.esupervisionApiUrl(),
  });
  try {
    const response = await context.get(`/v2/offenders/crn/${crn}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok()) {
      expect(
        response.ok(),
        `getting offender ailed for ${crn}: ${response.status()} ${await response.text()}`,
      ).toBeTruthy();
    }
    const body = await response.json();
    return body;
  } finally {
    await context.dispose();
  }
};

export const getOffenderUuidByCrn = async (
  crn: string,
  token: string,
): Promise<string | null> => {
  await request.newContext({
    baseURL: env.esupervisionApiUrl(),
  });
  {
    const offender = await getOffenderByCrn(crn, token);
    return (offender?.uuid as string) ?? null;
  }
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
): Promise<void> => {
  const context = await request.newContext({
    baseURL: env.esupervisionApiUrl(),
  });
  try {
    const response = await context.post(
      `/v2/offenders/${offenderUuid}/reactivate`,
      {
        headers: { Authorization: `Bearer ${token}` },
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
    if (!response.ok()) {
      expect(
        response.ok(),
        `REACTIVATE  failed for ${offenderUuid}: ${response.status()} ${await response.text()}`,
      ).toBeTruthy();
    }
    const body = await response.json();
    return body.uuid;
  } finally {
    await context.dispose();
  }
};
