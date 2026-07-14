import path from "path";
import {
  appendFileSync,
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import type { TestInfo } from "@playwright/test";

const CRN_FILE = path.join(process.cwd(), "created-crns.txt");

export const CRN_ATTACHMENT_NAME = "created-crn";

export const attachCreatedCrn = (
  testInfo: TestInfo,
  crn: string,
): Promise<void> =>
  testInfo.attach(CRN_ATTACHMENT_NAME, {
    body: crn,
    contentType: "text/plain",
  });

export const recordCreatedCrn = (crn: string): void => {
  if (existsSync(CRN_FILE)) {
    const content = readFileSync(CRN_FILE, "utf-8");
    if (content.length > 0 && !content.endsWith("\n")) {
      appendFileSync(CRN_FILE, "\n");
    }
  }
  appendFileSync(CRN_FILE, `${crn}\n`);
};

export const readCreatedCrns = (): string[] => {
  if (!existsSync(CRN_FILE)) {
    return [];
  }

  const crns = new Set(
    readFileSync(CRN_FILE, "utf-8")
      .split("\n")
      .map((crn) => crn.trim())
      .filter(Boolean),
  );
  return Array.from(crns);
};

export const writeCreatedCrns = (crns: string[]): void => {
  if (crns.length === 0) {
    rmSync(CRN_FILE, { force: true });
    return;
  }
  writeFileSync(CRN_FILE, crns.map((crn) => `${crn}\n`).join(""));
};
