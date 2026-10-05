# hmpps-esupervision-e2e-tests

Playwright E2E tests for online check ins and eSupervision user journeys.

## Setup

```bash
npm install
npx playwright install
cp .env.example .env
```

Fill in the values for your environment. If `ENV` is set and a matching
`.env.<ENV>` file exists, that file is loaded; otherwise the loader falls back
to `.env`. The standard test scripts set `ENV=test`.

If you have access to the eSupervision E2E 1Password vault, you can supply
secrets at runtime:

```bash
eval $(op signin)
op run --account ministryofjustice.1password.eu --env-file=./.env.1password -- npm run test
```

## Run

```bash
npm run test                            # all checkin:dev tests except dashboard
npm run test:e2e                        # new-offender E2E journeys
npm run test:welsh                      # Welsh-language E2E journey
npm run test:fallback-video             # liveness fallback: NO_MATCH, submit anyway
npm run test:manage-online-checkins-ui  # Manage Online Check Ins and MPOP journeys
npm run test:static                     # static pages
npm run test:dashboard                  # dashboard tests
```

Append `:headed` to supported scripts (for example, `npm run test:e2e:headed`)
to watch the browser.

```bash
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
npm run lint:fix        # eslint --fix
npm run report          # open the last HTML report
npm run cleanup:crns    # delete created offenders left behind by a run
```

## Test Structure

Practitioners start in MPOP, which hands check-in setup and management pages
over to Manage Online Check Ins (MOCI). MPOP login and case navigation pages
live under `src/support/pages/mpop/`; check-in pages are in
`src/support/pages/checkins-ui/`; MOCI pages are in
`src/support/pages/manage-online-checkins-ui/`.

## Liveness

Chromium uses a fake camera from
`src/media/mock-camera-capture.y4m` (configured in `playwright.config.ts`), so
no webcam is needed locally or in CI.

- The fallback-video test records a video, gets `NO_MATCH`, then submits anyway.
- The E2E check-in journey navigates directly to `/liveness/view` and submits
  without running the real AWS Face Liveness check.

## Test Data

A standard `npm run test` run creates five new offenders: three scenarios in
`new-offender-online-checkin.spec.ts`, one Welsh E2E offender, and one
fallback-video offender. Manage UI tests reuse configured CRNs. New-offender
setup creates a Delius case/event, completes an OASys Layer 1 assessment, and
waits for tier calculation; this requires `OASYS_URL`, `OASYS_USERNAME`, and
`OASYS_PASSWORD`.

| Test group | CRN use and expected starting state |
| --- | --- |
| New-offender E2E | Creates one offender per scenario. |
| Check-in fallback | Creates and configures one offender, then creates a check-in via API. |
| Manage workflows and validation | Reuses `TEST_MANAGE_CRN`: verified active check-ins, Email preference, a future check-in date, and no pre-existing custom questions before the custom-question suite. |
| Tier/setup journeys | Reuse `TEST_TIER_A_CRN` through `TEST_TIER_G_CRN`; each standard tier CRN must have its matching tier, an active supervision package, be outside the final third, and have no check-in setup. Setup date-validation tests use Tier G and do not submit setup. |
| Stop/restart | Uses `TEST_MPOP_STOP_RESTART_CRN`; the fixture ensures the check-in is active before stopping and restarting it. |
| Layout/dashboard | Layout needs no case. Dashboard tests reuse storage state from the setup project. |

The workflow requires `TEST_MANAGE_CRN`, `TEST_MPOP_STOP_RESTART_CRN`,
`TEST_TIER_A_CRN` through `TEST_TIER_G_CRN`, `TEST_TIER_MISSING_CRN`,
`TEST_TIER_NOT_SUPERVISED_CRN`, `TEST_NO_PACKAGE_CRN`,
`TEST_FINAL_THIRD_CRN`, and `TEST_EARLY_ENGAGEMENT_CRN`. Tests fail with a
missing-environment-variable error if any required CRN is unset. The dedicated
early-engagement CRN must have `inEarlyEngagement: true` and remain distinct from
the standard Tier A/B CRNs; standard CRN preconditions do not assume that flag
is false.

## Cleanup

Every newly created CRN is recorded in the gitignored `created-crns.txt`. The
Playwright cleanup reporter (`src/support/utils/crnCleanupReporter.ts`) deletes
CRNs from passing tests at the end of the run and retains CRNs from failed tests
for investigation. CRNs created during the run but not attached to a test result
are treated as orphans and deleted. Older entries already in the file at run
start are left for manual cleanup. Failed deletions remain in the file for a
later retry.

```bash
npm run cleanup:crns
CRNS=X123456,X654321 npm run cleanup:crns
```

To resolve secrets through 1Password:

```bash
op run --account ministryofjustice.1password.eu --env-file=./.env.1password -- npm run cleanup:crns
```

## CI

- `.github/workflows/playwright.yml` runs the main suite on a schedule and via
  `workflow_dispatch`.
- `.github/workflows/dashboard-playwright.yml` runs the dashboard suite with
  its own `DASHBOARD_URL` and Delius credentials.

Both workflows publish JUnit and HTML reports. The main Playwright config runs
CRN cleanup through its reporter after the test run.
