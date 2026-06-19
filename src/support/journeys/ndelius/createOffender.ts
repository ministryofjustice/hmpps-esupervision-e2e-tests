import { Page } from "@playwright/test";
import { login as loginToDelius } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/login.mjs";
import { deliusPerson } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/person.mjs";
import { createOffender } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/offender/create-offender.mjs";
import { createCommunityEvent } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/event/create-event.mjs";
import { internalTransfer } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/transfer/internal-transfer.mjs";
import { TEST_TEAM, TEST_STAFF } from "../../../data/delius/testData";
import { NewOffender } from "../../../data/delius/types";

export default class DeliusOffenderJourney {
  constructor(private readonly page: Page) {}

  async createTestOffender(): Promise<NewOffender> {
    const person = deliusPerson();
    await loginToDelius(this.page);
    const crn = await createOffender(this.page, {
      person,
      providerName: TEST_TEAM.provider,
    });
    if (!crn) {
      throw new Error("Delius did not return a CRN for the new offender");
    }
    await internalTransfer(this.page, {
      crn,
      allocation: { team: TEST_TEAM, staff: TEST_STAFF },
    });
    await createCommunityEvent(this.page, { crn });
    return {
      crn,
      person: {
        firstName: person.firstName,
        lastName: person.lastName,
        dob: person.dob,
      },
    };
  }
}
