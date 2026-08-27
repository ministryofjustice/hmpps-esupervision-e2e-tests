# hmpps-esupervision-e2e-tests

Playwright E2E tests for online check ins and eSupervision user journeys.

## Setup

```bash
npm install
npx playwright install
cp .env.example .env     # then fill in the values
```

## Configuration

URLs and credentials come from `.env` at the project root — see `.env.example`
for the full list.

If you have access to the eSupervision-E2E-tests 1Password vault, you can skip
`.env` and resolve secrets at runtime instead:

```bash
eval $(op signin)
op run --account ministryofjustice.1password.eu --env-file=./.env.1password -- npm run test
```

## Run

```bash
npm run test                      # everything except dashboard
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

Check in journeys are moving from MPOP to the new Manage Online Check Ins (MOCI)
UI, behind feature flags. Practitioners still start in MPOP, which either renders
the check in pages itself or redirects to MOCI depending on the flags.

A run targets one service or the other, picked by `LEGACY_MPOP`:

```bash
npm run test                                     # MOCI (default - CI, PR runs)

op run --account ministryofjustice.1password.eu --env-file=./.env.1password -- \
  env LEGACY_MPOP=true npm run test              # MPOP (manual legacy regression)
```

If the feature flags and `LEGACY_MPOP` disagree, the run fails fast rather than
quietly testing the wrong service.

### Retiring legacy MPOP

Every legacy-only line is tagged `TODO(legacy-mpop)`, each with inline
instructions for what to remove:

```bash
grep -rn "TODO(legacy-mpop)" src .env.example
```

**Keep**, despite the `mpop` folder name — MOCI reuses the same page headings
and `data-qa` hooks, so most of `src/support/pages/mpop/` still drives MOCI
pages after the migration.

## ENV: dev vs test

All suites read the same `.env`. The `ENV` variable only affects offender
create/delete (via `hmpps-probation-integration-e2e-tests`, which resolves the
Delius host from it — hence `ENV=test` on those scripts). App journeys read
their URLs directly and ignore `ENV`.

## Liveness and the fake camera

The real AWS Face Liveness check never runs. Chromium launches with a fake
camera (`src/media/mock-camera-capture.y4m`, wired up in `playwright.config.ts`),
so no webcam is needed locally or in CI.

Two suites cover the liveness step differently:

- **checkin** — records with the fake camera, gets NO_MATCH, then takes
  "Submit video anyway".
- **e2e** — skips liveness entirely, going straight to `/liveness/view` and
  taking "Submit anyway".

## Test data

A full run creates roughly a dozen offenders. Most specs create their own so
tests can run in any order; the exceptions are noted below.

| Suite               | Offender                                                             |
| -------------------- | --------------------------------------------------------------------- |
| `e2e`                | Creates its own, per run.                                             |
| `checkin`            | Creates its own, then drives a check in via API.                     |
| `mpop`               | Most specs create their own — a shared CRN's setup state can't be relied on to stay put between runs. Exceptions: `stop-restart-checkin` owns `TEST_MPOP_STOP_RESTART_CRN` and restores it before running; `eligibility-outcomes` owns `TEST_MPOP_ELIGIBILITY_CRN` and reuses it directly, since neither of its tests completes setup. |
| `manage-checkins-ui` | `change-contact-details` and `error-validation` create their own; `layout` needs none. |
| `dashboard`          | Creates nothing — signs in once via the `dashboard-setup` project and reuses the storage state. |

Note on `manage-checkins-ui`: only its contact-details tests are MOCI-only.
`error-validation`'s questions/stop/date tests run against whichever service
the flags select, and its date test walks the setup wizard as far as the date
page without completing it.

## Cleanup

Every created CRN is recorded in `created-crns.txt` (gitignored). A reporter
(`src/support/utils/crnCleanupReporter.ts`) deletes them automatically at the
end of a run:

- Deleted if every test that used it passed.
- Kept if any test that used it failed, so there's evidence to inspect.
- Deleted anyway if it was created this run but never reached a test result at
  all (e.g. a `beforeAll` failed right after creating the offender) — nothing
  to keep it for.
- Left untouched if it's from an earlier run (already in the file when this
  one started).

Anything that fails to delete stays in the file for the next run to retry.

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
reports. There's no separate teardown step — cleanup happens in the reporter.
