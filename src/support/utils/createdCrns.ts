import path from "path";
import fs, { appendFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "fs";

const CRN_FILE = path.join(process.cwd(), "created-crns.txt");
console.log(CRN_FILE);

export const recordCreatedCrn = (crn: string): void => {
  if (existsSync(CRN_FILE)) {
    const content = fs.readFileSync(CRN_FILE, "utf-8");
    if (content.length > 0 && !content.endsWith("\n")) {
      appendFileSync(CRN_FILE, "\n");
    }
  }
  appendFileSync(CRN_FILE, `${crn}\n`);
};

export const readCreatedCrns = (): string[] => {
  if (!fs.existsSync(CRN_FILE)) {
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
