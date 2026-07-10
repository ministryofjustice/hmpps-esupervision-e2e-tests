import { readCreatedCrns, writeCreatedCrns } from "./createdCrns";
import { cleanupCrns } from "../../scripts/cleanupCrns";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";

const CRN_ATTACHMENT_NAME = "created-crn";

export default class CrnCleanupReporter implements Reporter {
  private readonly created = new Set<string>();
  private readonly keep = new Set<string>();

  onTestEnd(test: TestCase, result: TestResult): void {
    const passed = result.status === test.expectedStatus;
    for (const crn of this.crnsRecordedBy(result)) {
      this.created.add(crn);
      if (!passed) this.keep.add(crn);
    }
  }
  async onEnd(): Promise<void> {
    console.log(
      `CRN cleanup: onEnd - ${this.created.size} created, ${this.keep.size}`,
    );
    const toDelete = [...this.created].filter((crn) => !this.keep.has(crn));
    if (toDelete.length === 0) return;

    try {
      const failed = await cleanupCrns(toDelete);
      const deleted = new Set(toDelete.filter((crn) => !failed.includes(crn)));

      writeCreatedCrns(readCreatedCrns().filter((crn) => !deleted.has(crn)));
      console.log(
        `CRN cleanup: deleted ${deleted.size}, kept ${this.keep.size}, failed ${failed.length}`,
      );
    } catch (error) {
      console.log(`Cleanup errored: ${(error as Error).message}`);
    }
  }

  private crnsRecordedBy(result: TestResult): string[] {
    const crns: string[] = [];
    for (const item of result.attachments) {
      if (item.name !== CRN_ATTACHMENT_NAME || !item.body) continue;
      const crn = item.body.toString().trim();
      if (crn) crns.push(crn);
    }
    return crns;
  }
}
