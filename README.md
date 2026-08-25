# hmpps-esupervision-e2e-tests

Playwright E2E tests for online check ins and eSupervision user journeys.

## Setup

```bash
npm install
npx playwright install
cp .env.example .env     # then fill in the values
```

## Configuration

URLs and credentials come from `.env` at the project root. See `.env.example`
for the full list.

With access to the eSupervision-E2E-tests 1Password vault you can skip `.env`
and resolve secrets at runtime:

```bash
eval $(op signin)
op run --account ministryofjustice.1password.eu --env-file=./.env.1password -- npm test
```

## Run

```bash
npm test                          # everything except dashboard
npm run test:mpop                 # practitioner journeys
npm run test:manage-checkins-ui   # manage online check ins UI
npm run test:e2e                  # create offender -> set up -> complete a check in
npm run test:welsh                # e2e check in in Welsh (Cymraeg)
npm run test:fallback-video       # liveness video fallback: NO_MATCH, submit anyway
npm run test:static               # static pages
npm run test:dashboard            # data dashboard
```

```bash
npm run typecheck                 # tsc --noEmit
npm run lint                      # eslint
npm run lint:fix                  # eslint --fix
npm run report                    # open the last HTML report
npm run cleanup:crns              # delete offenders left behind by a run
```

Append `:headed` to most test scripts (e.g. `test:e2e:headed`) to watch them run.

## Manage Online Check Ins vs legacy MPOP

Check in journeys are moving from MPOP to the Manage Online Check Ins UI behind
feature flags. Practitioners still start in MPOP, which either renders the check
in pages itself or redirects the journey to the new service.

The suite supports two states:

- **Normal** — migration flags ON. Journeys land in Manage Online Check Ins.
  Used by CI and PR runs.
- **Legacy regression** — flags OFF in Flipt **and** `LEGACY_MPOP=true`.

```bash
op run --account ministryofjustice.1password.eu --env-file=./.env.1password -- \
  env LEGACY_MPOP=true npm test
```

One run targets one service. Mixed states fail fast with an actionable message
rather than testing the wrong service.

Legacy-only code is marked `TODO(legacy-mpop)`, so retiring MPOP check ins is a
mechanical delete.

## ENV: dev vs test

All suites read the same `.env`.

`ENV` only affects offender create/delete, which goes through
`hmpps-probation-integration-e2e-tests` and resolves the Delius host from it —
hence `ENV=test` on those scripts. App journeys read their URLs directly and
ignore `ENV`.

## Liveness and the fake camera

The real AWS Face Liveness check is never run. Chromium is launched with a fake
camera (`src/media/mock-camera-capture.y4m`, wired up in `playwright.config.ts`),
so no webcam is needed locally or in CI.

Two suites cover the step differently:

- **checkin** — records with the fake camera, gets NO_MATCH, then takes
  "Submit video anyway".
- **e2e** — skips liveness by going straight to `/liveness/view` and taking
  "Submit anyway".

## Test data

- **e2e** — creates its own offender per run.
- **checkin** — creates a check in via API for `TEST_CRN`, then drives the UI.
- **mpop** — most specs create their own offender, because they
  mutate it and sharing would make specs order dependent. Two exceptions use
  pre-existing CRNs: `eligibility-outcomes` and the date validation test read
  `TEST_MPOP_CRN` without submitting, and `restart-checkin` owns
  `TEST_MPOP_STOP_RESTART_CRN` and restores it before running.
- **manage-checkins-ui** — `change-contact-details` and `error-validation`
  create their own offender; `layout` needs none.
- **dashboard** — creates nothing. Signs in once via the `dashboard-setup`
  project and reuses the storage state.

A full run creates around 13 offenders.

## Cleanup

Every created CRN is recorded in `created-crns.txt` (gitignored). Cleanup runs
automatically at the end of a run via the reporter in
`src/support/utils/crnCleanupReporter.ts`.

A CRN is deleted only when every test that used it passed, so an unrelated
failure does not block cleanup. Anything that fails to delete stays in the file
for the next run.

```bash
op run --account ministryofjustice.1password.eu --env-file=./.env.1password -- npm run cleanup:crns

CRNS=X123456,X654321 npm run cleanup:crns   # target specific CRNs
```

## CI

- **`playwright.yml`** — main suite (`npm test`), on a schedule and via
  `workflow_dispatch`.
- **`dashboard-playwright.yml`** — dashboard suite, with its own `DASHBOARD_URL`
  and Delius credentials.

Each runs a single `playwright test` invocation and uploads JUnit and HTML
reports. There is no separate teardown step — cleanup happens in the reporter.
