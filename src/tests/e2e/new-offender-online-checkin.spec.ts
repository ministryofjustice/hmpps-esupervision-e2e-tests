import { getToken } from "../../api/auth";
import { test } from "@playwright/test";
import OnlineCheckinJourney from "../../support/journeys/e2e/onlineCheckinJourney";
import { waitForAwaitingCheckinUuid } from "../../support/utils/waitForCheckin";
import { NewOffender } from "../../data/delius/types";
import { createEsupervisionCheckin } from "../../api/checkin";
import {
  dueDateString,
  today,
  firstCheckinDateString,
} from "../../support/utils/date";
import {
  Annotation,
  ReviewDecision,
} from "../../support/journeys/manage-online-checkins-ui/reviewCheckinJourney";
import { IdentityDecision } from "../../support/pages/manage-online-checkins-ui/reviewIdentityPage";
import { CustomQuestion } from "../../data/models";
import { OffenderProfile } from "../../support/journeys/ndelius/deliusOffenderJourney";

interface CheckinScenario {
  name: string;
  firstCheckinDaysAhead: number;
  getCheckinUuid: (offender: NewOffender, token: string) => Promise<string>;
  profile?: OffenderProfile;
  customQuestions?: CustomQuestion[];
  expectNoChangeQuestions?: boolean;
  review?: ReviewDecision;
  annotation?: Annotation;
  /** Verify confirmation page links return to MPOP after setup completes. */
  assertConfirmationLinks?: boolean;
  /** Verify setup enters a missing contact detail, then confirms it on file. */
  assertContactRoutes?: boolean;
  /** Verify review handoff and reviewed-page Back link navigation to MPOP. */
  assertMpopHandoff?: boolean;
}

const apiCheckin = (offender: NewOffender, token: string): Promise<string> =>
  createEsupervisionCheckin(offender.crn, dueDateString(today), token);

const scenarios: CheckinScenario[] = [
  {
    name: "checkin created by the scheduler - first checkin today, MATCH review",
    firstCheckinDaysAhead: 0,
    profile: "custodialAge25",
    assertConfirmationLinks: true,
    assertContactRoutes: true,
    assertMpopHandoff: true,
    getCheckinUuid: (offender, token) =>
      waitForAwaitingCheckinUuid(offender.crn, token),

    // First check is in today, so the "change questions" link should not be available
    expectNoChangeQuestions: true,
    // Both review pages refuse their required answer being left blank - the
    // identity decision, then the sensitive information answer - and then
    // the review carries on. Covered here rather than in a spec of its own: it
    // needs a completed check in, which this scenario already has.
    review: {
      identity: IdentityDecision.MATCH,
      riskManagement: false,
      sensitive: false,
      note: "Identity confirmed, nothing concerning",
      assertValidation: true,
    },
    annotation: { note: "Reviewed, no further action", sensitive: false },
  },
  {
    name: "checkin created via API - first check in date in the future, add custom questions and complete the check in, NO_MATCH review",
    firstCheckinDaysAhead: 4,
    profile: "highRiskAge25",
    getCheckinUuid: apiCheckin,
    customQuestions: [
      { template: "Do you", text: "have an update about something" },
      { template: "What have you been doing at", text: "home" },
      { template: "Has anything changed", text: "physical or mental health" },
    ],
    review: {
      identity: IdentityDecision.NO_MATCH,
      riskManagement: true,
      sensitive: true,
      note: "Person in the checkin is not the offender",
    },
    annotation: { note: "Logged ID mismatch", sensitive: true },
  },

  {
    name: "checkin created via API - first check in date in the future, MATCH_WITH_CONCERN review",
    firstCheckinDaysAhead: 4,
    profile: "tierCAge25",
    getCheckinUuid: apiCheckin,
    review: {
      identity: IdentityDecision.MATCH_WITH_CONCERN,
      riskManagement: false,
      sensitive: false,
      note: "Identity matches but appearance is concerning",
    },
    annotation: {
      note: "Follow-up after concerning check in",
      sensitive: false,
    },
  },
];

// These scenarios share a single Delius account and drive the MPOP setup journey,
// so they must not run concurrently. The suite runs a single-worker which keeps them independent
// a failure in one test does not skip the other test

test.describe("Online check in for a new offender", () => {
  for (const scenario of scenarios) {
    test(`Create offender and setup online checkin and Completes a checkin when ${scenario.name} -> complete check in`, async ({
      page,
    }) => {
      const journey = new OnlineCheckinJourney(page);
      const offender = await journey.createOffenderAndSetupCheckins(
        firstCheckinDateString(scenario.firstCheckinDaysAhead),
        {
          profile: scenario.profile,
          assertConfirmationLinks: scenario.assertConfirmationLinks,
          assertContactRoutes: scenario.assertContactRoutes,
        },
      );
      if (scenario.expectNoChangeQuestions) {
        await journey.assertChangeQuestionsUnavailable(offender.crn);
      }
      if (scenario.customQuestions) {
        await journey.assignCustomQuestions(
          offender.crn,
          scenario.customQuestions,
        );
      }
      const token = await getToken();
      const checkinUuid = await scenario.getCheckinUuid(offender, token);

      const details = await journey.completeCheckin(
        checkinUuid,
        offender,
        scenario.customQuestions?.map((q) => q.text) ?? [],
      );

      await journey.reviewCheckin(offender.crn, scenario.review, details, {
        assertMpopHandoff: scenario.assertMpopHandoff,
      });
      if (scenario.assertMpopHandoff) {
        await journey.assertReviewedCheckinBackLinkLandsInMpop(offender.crn);
      }

      await journey.annotateCheckin(offender.crn, scenario.annotation);
    });
  }
});
