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
  private preExisting = new Set<string>();

  onBegin(): void {
    // Snapshot the backlog already in the file so onEnd's orphan sweep only
    // touches CRNs recorded during this run, not historical leftovers - those
    // are for manual `npm run cleanup:crns` review, not an automatic sweep.
    this.preExisting = new Set(readCreatedCrns());
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const previous = this.testStates.get(test.id);
    const crns = this.testStates.get(test.id)?.crns ?? new Set<string>();
    for (const crn of this.crnsRecordedBy(result)) {
      crns.add(crn);
    }
    this.testStates.set(test.id, {
      crns,
      succeeded:
        (previous?.succeeded ?? false) || result.status === test.expectedStatus,
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

    // recordCreatedCrn writes to created-crns.txt as soon as an offender exists, so
    // a CRN whose creating hook/test never reached an attachCreatedCrn call (e.g. a
    // beforeAll that failed right after creating it) still lands here even though
    // it's absent from `created`. There's no test result to check, so there's
    // nothing to retain it for - safe to delete alongside the rest. Excludes
    // preExisting so historical backlog from earlier runs is left for manual review.
    const orphaned = readCreatedCrns().filter(
      (crn) => !created.has(crn) && !this.preExisting.has(crn),
    );

    const toDelete = [...created]
      .filter((crn) => !retained.has(crn))
      .concat(orphaned);
    if (!toDelete.length) {
      console.log(`CRN cleanup: nothing to delete, ${retained.size} retained`);
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
