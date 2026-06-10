import { Buffer } from "buffer";
import { env } from "../config/env";
import { request } from "@playwright/test";

export const getToken = async (): Promise<string> => {
  const context = await request.newContext({ baseURL: env.authUrl() });
  try {
    const creds = Buffer.from(
      `${env.authClientId()}:${env.authClientSecret()}`,
    ).toString("base64");
    const response = await context.post(
      `/auth/oauth/token?grant_type=client_credentials`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${creds}`,
        },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `Token request failed: ${response.status()} ${await response.text()}`,
      );
    }
    const json = await response.json();
    return json.access_token;
  } finally {
    await context.dispose();
  }
};
