import {
  CRN_ATTACHMENT_NAME,
  readCreatedCrns,
  writeCreatedCrns,
} from "./createdCrns";
import { cleanupCrns } from "../../scripts/cleanupCrns";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";

interface TestCleanupState {
  crns: Set<string>;
  succeeded: boolean;
}

export default class CrnCleanupReporter implements Reporter {
  private readonly testStates = new Map<string, TestCleanupState>();

  onTestEnd(test: TestCase, result: TestResult): void {
    const crns = this.testStates.get(test.id)?.crns ?? new Set<string>();
    for (const crn of this.crnsRecordedBy(result)) {
      crns.add(crn);
    }
    this.testStates.set(test.id, {
      crns,
      succeeded: result.status === test.expectedStatus,
    });
  }
  async onEnd(): Promise<void> {
    const created = new Set<string>();
    const retained = new Set<string>();

    for (const state of this.testStates.values()) {
      for (const crn of state.crns) {
        created.add(crn);

        if (!state.succeeded) {
          retained.add(crn);
        }
      }
    }
    const toDelete = [...created].filter((crn) => !retained.has(crn));
    if (!toDelete.length) {
      console.log(`CRN cleanup: nothing to delete ${retained.size} retained)`);
      return;
    }

    try {
      const failed = new Set(await cleanupCrns(toDelete));
      const deleted = new Set(toDelete.filter((crn) => !failed.has(crn)));

      writeCreatedCrns(readCreatedCrns().filter((crn) => !deleted.has(crn)));
      console.log(
        `CRN cleanup completed: ${deleted.size} deleted, ${retained.size} retained, ${failed.size} failed`,
      );

      if (failed.size > 0) {
        console.log(`Failed to delete CRN: ${[...failed].join(",")}`);
      }
    } catch (error) {
      console.log(`Cleanup failed: ${(error as Error).message}`);
    }
  }

  private crnsRecordedBy(result: TestResult): Set<string> {
    const crns = new Set<string>();
    for (const attachment of result.attachments) {
      if (
        attachment.name !== CRN_ATTACHMENT_NAME ||
        attachment.body === undefined
      ) {
        continue;
      }
      const crn = attachment.body.toString("utf-8").trim();
      if (crn) {
        crns.add(crn);
      }
    }
    return crns;
  }
}
