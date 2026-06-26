import { CheckInPerson } from "../models";

export type { Person } from "@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/person.mjs";
export type {
  Team,
  Staff,
  Allocation,
} from "@ministryofjustice/hmpps-probation-integration-e2e-tests/test-data/test-data.mjs";

export interface NewOffender {
  crn: string;
  person: CheckInPerson;
}
