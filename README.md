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
npm run test                            # checkin:dev tests except dashboard and expiry job
npm run test:e2e                        # new-offender E2E journeys (excludes expiry job test)
npm run test:missed-checkin             # missed check-in expiry, review, and updates
npm run test:welsh                      # Welsh-language E2E journey
npm run test:fallback-video             # liveness fallback: NO_MATCH, submit anyway
npm run test:manage-online-checkins-ui  # Manage Online Check Ins and MPOP journeys
npm run test:static                     # static pages
npm run test:chatbot                    # chatbot is displayed and opens
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
| Manage workflows and validation | Reuses `TEST_MANAGE_CRN`: verified active check-ins, 2+ active sentences, Email preference, a future check-in date, and no pre-existing custom questions before the custom-question suite. |
| Tier/setup journeys | Reuse `TEST_TIER_A_CRN` through `TEST_TIER_G_CRN`; each standard tier CRN must have its matching tier, an active supervision package, be outside the final third, and have no check-in setup. Setup date-validation tests use Tier G and do not submit setup. |
| Stop/restart | Uses `TEST_MPOP_STOP_RESTART_CRN` which needs 2+ active sentences; the fixture ensures the check-in is active before stopping and restarting it. The ad hoc tests in this spec switch the CRN to ad hoc; `afterAll` stops and restarts it on weekly check ins through the API, so each run starts from the same state. |
| Restart (accredited programme) | Uses `TEST_RESTART_ACCREDITED_CRN`: a Tier A/B case with check ins set up, not in early engagement, with an email address in NDelius. `beforeAll` stops it through the API if it is active, so the test can restart it through the accredited programme route. |
| Ad hoc validation and cancellation | Reuses `TEST_ADHOC_CRN`: configured for ad hoc check-ins with nothing booked. Validation tests never submit a valid date. `cancel-checkin.spec.ts` cancels stale open check-ins, creates and cancels one due today, and uses `afterAll` to cancel any remaining open check-ins through the API, leaving nothing booked. |
| Sentence selection | Reuses `TEST_TIER_G_CRN` and `TEST_MANAGE_CRN`; both need 2+ active sentences with different end dates. Setup is never submitted, and the manage test puts the original sentence back. |
| Layout/dashboard | Layout needs no case. Dashboard tests reuse storage state from the setup project. |

The workflow requires `TEST_MANAGE_CRN`, `TEST_MPOP_STOP_RESTART_CRN`,
`TEST_TIER_A_CRN` through `TEST_TIER_G_CRN`,
`TEST_TIER_NOT_SUPERVISED_CRN`, `TEST_NO_PACKAGE_CRN`,
`TEST_FINAL_THIRD_CRN`, `TEST_EARLY_ENGAGEMENT_CRN`, and `TEST_ADHOC_CRN`. Tests fail with a
missing-environment-variable error if any required CRN is unset. The dedicated
early-engagement CRN must have `inEarlyEngagement: true` and remain distinct from
the standard Tier A/B CRNs; standard CRN preconditions do not assume that flag
is false.

### Create a final-third CRN

From the command line (needs the variables below in `.env.test`):

```bash
npm run create:final-third-crn
# Several at once:
npm run create:final-third-crn -- --count 3
# Watch it run:
npm run create:final-third-crn -- --headed
```

It prints `final-third CRN ready: <CRN>` for each case. Other options, such as
`--headed`, are passed to Playwright. The command uses the line reporter only,
so the automatic cleanup does not run and the CRNs are kept; they are still
recorded in `created-crns.txt` for later `npm run cleanup:crns`.
A failed attempt is retried once with a new CRN; the failed CRN stays in that
file too.

Or use the setup journey from a Playwright test:

```typescript
const offender = await new OnlineCheckinJourney(page).createOffenderInFinalThird();
// Use offender.crn to test final-third eligibility.
```

The method returns the same created-offender details as the Delius journey,
after verifying that the case is in its final third. It does not set up online
check ins. Like other created test cases, the CRN is attached to the calling
test and recorded in `created-crns.txt`: normal cleanup deletes passing cases
and retains failing cases for investigation.

Put the following in the gitignored `.env.test` at the root of this checkout
(loaded when `ENV=test`), or provide them as environment variables:

```dotenv
DELIUS_URL=https://ndelius.test.probation.service.justice.gov.uk
DELIUS_USERNAME=
DELIUS_PASSWORD=
OASYS_URL=https://t2.oasys.service.justice.gov.uk/eor/f?p=100:101
OASYS_USERNAME=
OASYS_PASSWORD=
AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk
AUTH_CLIENT_ID=
AUTH_CLIENT_SECRET=
ESUPERVISION_API_URL=https://esupervision-api-dev.hmpps.service.justice.gov.uk
```

The Delius account must be able to create a custodial sentence, record release
and maintain Throughcare dates. The OASys account must be able to complete and
sign the assessment. Use the existing eSupervision test API client for reads.
No DPS username, Prison API client or custody-key-date API access is required.

The method validates that service URLs target dev/test before creating data.
It reuses the shared Delius helpers, creates a six-month
`Adult Custody < 12m` sentence starting five months ago, records release after
three months, manually records the calculated final-third date using
Throughcare's **T/C Dates** form, then completes OASys Layer 1. It then adds a
**Low RoSH** registration in Delius if the case has no current RoSH
registration, and waits for a tier that is not provisional.

The registration matters because Tier marks a case provisional when it has no
RoSH or MAPPA registration and its tier is below C. Supervision Packages
treats a provisional tier as "not yet known" (`SPNK`), so the case reports
`onSupervisionPackage: false` even while in its final third. OASys sign-and-lock
should create the registration, but it does not always arrive. Adding it also
triggers a Tier and Supervision Packages recalculation.
It does not create or link a NOMIS record, call Prison API or request a
custody-date refresh. It does not depend on the
`calculate-key-dates-from-delius` feature flag.

Success requires eSupervision to report
`onSupervisionPackage: true, inFinalThird: true`; the latter reflects
Supervision Packages' current `FTHRD` phase.
Eligibility alone is not enough. The sentence expires about a month after creation.
The RoSH step was proven by hand on Y092038 and Y092039; the full combined
setup has not yet been run end to end.

The method does not retry creation itself; any retry of the calling test creates
a new CRN, just like the other setup journeys. Manual cleanup can delete a
failed case's Delius/eSupervision records.
Date-planning tests can be run without creating any data:

```bash
npm run test:unit
```

## Missed Check-in Expiry

Run the expiry journey separately with `npm run test:missed-checkin`. It creates
a new Tier G offender, creates a check-in due four days ago, triggers the
`checkin-expiry` job, then verifies the check-in can be reviewed and annotated
with sensitive updates while retaining its expired status. A second test sets up an adhoc offender, expires a check in the same way and verifies nothing is booked afterwards. The general E2E
commands (`test:e2e` and `test:e2e:headed`) exclude this test because the expiry
job operates across the shared dev environment rather than only on the test
check-in. Running it may expire other eligible overdue check-ins in dev.

## Cleanup

Every newly created CRN is recorded in the gitignored `created-crns.txt`. The
Playwright cleanup reporter (`src/support/utils/crnCleanupReporter.ts`) deletes
CRNs from passing tests at the end of the run and retains CRNs from failed tests
for investigation. CRNs created during the run but not attached to a test result
are treated as orphans and deleted. Older entries already in the file at run
start are left for manual cleanup. Failed deletions remain in the file for a
later retry.

Each CRN is deactivated in the eSupervision API, deleted in NDelius, then
deleted from the API.

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
- `.github/workflows/missed-checkin-playwright.yml` runs the missed check-in
  expiry test.
- `.github/workflows/dashboard-playwright.yml` runs the dashboard suite with
  its own `DASHBOARD_URL` and Delius credentials.

All three workflows publish JUnit and HTML reports. The main Playwright config runs
CRN cleanup through its reporter after the test run.
