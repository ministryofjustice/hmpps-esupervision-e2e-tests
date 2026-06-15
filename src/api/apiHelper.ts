import { APIRequestContext, APIResponse, request } from "@playwright/test";
import { env } from "../config/env";

export const withApiContext = async <T>(
  fn: (ctx: APIRequestContext) => Promise<T>,
): Promise<T> => {
  const context = await request.newContext({
    baseURL: env.esupervisionApiUrl(),
  });
  try {
    return await fn(context);
  } finally {
    await context.dispose();
  }
};

export const assertOk = async (
  response: APIResponse,
  action: string,
): Promise<void> => {
  if (!response.ok()) {
    throw new Error(
      `${action} failed: ${response.status()} ${await response.text()}`,
    );
  }
};

export const authHeader = (token: string): { Authorization: string } => ({
  Authorization: `Bearer ${token}`,
});
