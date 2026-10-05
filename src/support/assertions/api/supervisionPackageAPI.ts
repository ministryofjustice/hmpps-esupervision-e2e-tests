import { expect } from "@playwright/test";
import { getToken } from "../../../api/auth";
import {
  findSupervisionPackageStatus,
  getOffenderByCrn,
  getOffenderHeader,
  SupervisionPackageStatus,
} from "../../../api/offender";
import { ExistingTier } from "../../../data/models";

type PackageEligibilityExpectation = Pick<
  SupervisionPackageStatus,
  "onSupervisionPackage" | "inFinalThird"
> &
  Partial<Pick<SupervisionPackageStatus, "inEarlyEngagement">>;

const assertPackageEligibilityWithToken = async (
  crn: string,
  expected: PackageEligibilityExpectation,
  token: string,
): Promise<void> => {
  await expect
    .poll(
      async () => {
        const status = await findSupervisionPackageStatus(crn, token);
        if (!status) return null;
        return {
          onSupervisionPackage: status.onSupervisionPackage,
          inFinalThird: status.inFinalThird,
          inEarlyEngagement: status.inEarlyEngagement,
        };
      },
      {
        message: `CRN ${crn} should have package eligibility ${JSON.stringify(expected)}`,
      },
    )
    .toMatchObject(expected);
};

const assertEligiblePackagePreconditions = async (
  crn: string,
  token: string,
): Promise<void> =>
  assertPackageEligibilityWithToken(
    crn,
    {
      onSupervisionPackage: true,
      inFinalThird: false,
    },
    token,
  );

export const assertPackageEligibility = async (
  crn: string,
  expected: PackageEligibilityExpectation,
): Promise<void> =>
  assertPackageEligibilityWithToken(crn, expected, await getToken());

export const assertTierHeader = async (
  crn: string,
  expectedTier: string | null,
): Promise<void> => {
  const token = await getToken();
  await expect
    .poll(async () => (await getOffenderHeader(crn, token)).tierScore, {
      message: `CRN ${crn} should have tier header ${expectedTier}`,
    })
    .toBe(expectedTier);
};

const assertTierAndPackagePreconditions = async (
  crn: string,
  token: string,
  expectedTier?: ExistingTier,
): Promise<void> => {
  await expect
    .poll(
      async () => {
        const header = await getOffenderHeader(crn, token);
        return header.tierScore?.charAt(0).toUpperCase() ?? null;
      },
      {
        message: expectedTier
          ? `CRN ${crn} should have Tier ${expectedTier}`
          : `CRN ${crn} should have a calculated Tier A-G`,
      },
    )
    .toMatch(expectedTier ?? /^[A-G]$/);

  await assertEligiblePackagePreconditions(crn, token);
};

export const assertTierCrnPreconditions = async (
  crn: string,
  expectedTier: ExistingTier,
): Promise<void> =>
  assertTierAndPackagePreconditions(crn, await getToken(), expectedTier);

export const assertActiveManageCrn = async (crn: string): Promise<void> => {
  const token = await getToken();
  const offender = await getOffenderByCrn(crn, token);
  expect(offender.status, `CRN ${crn} must have active check ins`).toBe(
    "VERIFIED",
  );
};
