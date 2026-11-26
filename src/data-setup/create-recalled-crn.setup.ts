import OnlineCheckinJourney from "../support/journeys/e2e/onlineCheckinJourney";
import { createCrnTests } from "./createCrnTests";

// npm run create:recalled-crn -- [--count <n>]: CRNs on a supervision package
// that eSupervision reports as recalled. Not part of any test suite.
createCrnTests("recalled", (page) =>
  new OnlineCheckinJourney(page).createRecalledOffender(),
);
