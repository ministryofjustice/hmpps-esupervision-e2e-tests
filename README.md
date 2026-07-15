# hmpps-esupervision-e2e-tests

Playwright E2E tests for online check ins and eSupervision user journeys

## Setup

```bash
npm install
npx playwright install
cp .env.example .env     # then fill in the values
```

## Configuration

Credentials and URLs are configured using a `.env` file at the project root and loaded via `src/config/loadEnv.ts` and accessed through `src/config/env.ts`.

If you have access to the eSupervision-E2E-tests 1Password Vault, you can skip the
`.env` file and resolve secrets at runtime by prefixing commands with `op run`

```bash
eval $(op signin)
op run --account ministryofjustice.1password.eu --env-file=./.env.1password -- npm run test
```

## Run

```bash
npm test                # run all suites(mpop + e2e + checkin/static)
npm run test:parallel   # check in + static specs
npm run test:mpop       # run only mpop setup specs (src/tests/mpop)
npm run test:e2e        # offender lifecycle: create -> setup checkin -> complete checkin
npm run cleanup:crns    # delete offenders created by e2e test suite
npm run report          # open the last HTML report
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
```

Append `:headed` to most scripts (e.g `test:e2e:headed`) to watch them run

## ENV: dev vs test

All suites read the same .env file.

`ENV` selects Delius the offender create/delete path goes through `hmpps-probation-integration-e2e-tests` package, which resolves the Delius host from ENV, so the e2e tests run under ENV= test. The app journeys (mpop,checkin,status) read URLs directly and unaffected by ENV.

The per suite scrips set ENV accordingly (see package.json scripts)

## How the video / liveness step is handled

The real AWS Face Liveness check is **not** run in these tests. The browser is
launched with a **fake camera** (a recorded file, see `playwright.config.ts`):

```
--use-fake-device-for-media-stream
--use-fake-ui-for-media-stream
--use-file-for-fake-video-capture=<absolute path to src/media/mock-camera-capture.y4m>
```
Two suites cover the liveness step in two different ways:

checkin (submit-checkin-liveness-fallback-video-noMatch) test the video fallback: the widget can't run headlessly so it self-navigates to an outcome page(which unlocks the fallback); the test records with the fake camera, gets NO match and takes "Submit video anyway" to complete check in.

e2e (new-offender-online-checkin) skip liveness: it goes straight to /liveness/view and takes "Submit anyway" so no video is recorded

## Cleanup

The e2e suite and the mpop custom questions spec create offenders and record every CRN they create in `created-crns.txt` (gitIgnored). Cleanup runs automatically at the end of a run via Playwright reporter `src/support/utils/crnCleanupReporter.ts` which deletes the offenders.
Deletion is per offender, a CRN is deleted only when every test that used it passed. Each test tags the CRN it creates with `testInfo.attach("created-crn",..)` and the reporter reads those to decide. So a failure in an unrelated spec does not block cleanup if CRN whose own tests passed.
```bash
op run --account ministryofjustice.1password.eu --env-file=./.env.1password -- npm run cleanup:crns
```

Any crn that fail to delete stay in the file `created-crns.txt` for the next run. To target specific CRNs directly

```bash
CRNS=X123456,X654321 npm run cleanup:crns
```

## CI

The playwright workflow runs on a schedule and via manual `workflow_dispatch`.

The suite runs in a single `playwright test` and produces one report ( a Junit and HTML report as an artifact)

There is no separate teardown step in the specs. Cleanup runs in the reporter at the end of the run, deleting the offenders whose test passed.

## Notes

Test data differs per suite:

- **e2e** spec creates its own offender in Delius per run.
- **checkin** creates a checkin via API (`createEsupervisionCheckin`) for `TEST_CRN`, then drives the UI.
- **mpop** the custom question spec creates a fresh offender per run; other mpop specs run against pre-existing CRNs the tests don't create or delete them
- **manage-checkins-ui** no test data. It signs in and asserts the header, footer and beta phase banner components
