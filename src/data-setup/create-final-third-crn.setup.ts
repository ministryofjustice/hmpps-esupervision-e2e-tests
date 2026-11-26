import OnlineCheckinJourney from "../support/journeys/e2e/onlineCheckinJourney";
import { createCrnTests } from "./createCrnTests";

// npm run create:final-third-crn -- [--count <n>]: CRNs in their final third,
// on a supervision package. Not part of any test suite.
createCrnTests("final-third", (page) =>
  new OnlineCheckinJourney(page).createOffenderInFinalThird(),
);
