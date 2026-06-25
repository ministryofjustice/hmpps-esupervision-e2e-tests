# hmpps-esupervision-e2e-tests

Playwright E2E tests for online check ins and eSupervision user journeys

## Setup

```bash
npm install
npx playwright install
```

## Configuration

Credentials and URLs are configured using a `.env` file at the root of the project.

If you have access to the eSupervision-E2E-tests 1Password Vault, you can use the `.env.1password` file by prefixing any npm commands with `op run --account ministryofjustice.1password.eu --env-file=./.env.1password`

For example,
```shell
op run --account ministryofjustice.1password.eu --env-file=./.env.1password -- npm run test
```

See https://developer.1password.com/docs/cli/secrets-environment-variables#use-environment-env-files

cp -n .env.example .env 


If you have access to the Probation Integration 1Password Vault, you can use the `.env.1password` file by prefixing any npm commands with `op run --account ministryofjustice.1password.eu --env-file=./.env.1password`
 # then fill in the values
```

## Run

```bash
npm test                # run all suites(mpop + e2e + checkin/static)
npm run test:parallel   # check in + static specs
npm run test:mpop       # run only mpop setup specs (src/tests/mpop)
npm run test:e2e        # offender lifecycle: create -> setup checkin -> complete checkin
npm run cleanup:crns  # delete offenders created by e2e test suite
npm run report      # open the last HTML report
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

Append `:headed` to most scripts (e.g `test:e2e:headed`) to watch them run

Configuration is read from `.env.${ENV}` (so `.env.dev`) via `src/config/env.ts`.

## ENV: dev vs test

`ENV` the app journeys (mpop, checkin,static) run under `ENV=dev` - they read service URLs directly, so `ENV` only selects the `.env.${ENV}`
file there. The offender create/delete path goes through the `hmpps-probation-integration-e2e-tests` packages, which resolves Delius
host only from `ENV` so `test:e2e` and `cleanup:crns` run under `ENV=test` .

## How the video / liveness step is handled

The real AWS Face Liveness check is **not** run in these tests. The browser is
launched with a **fake camera** (a recorded file, see `playwright.config.ts`):

```
--use-fake-device-for-media-stream
--use-fake-ui-for-media-stream
--use-file-for-fake-video-capture=<absolute path to src/media/mock-camera-capture.y4m>
```

Because the fake video is not the offender's face, identity verification returns
**NO MATCH**, and the test takes the **"Submit video anyway"** path to complete
the check in. So this suite verifies the no-match route end to end; it does not
assert a successful identity match.

## Cleanup

The e2e suite records every CRN it creates in `created-crns.txt` (gitIgnored). Deleting those offenders is a **separate step**
the suite does not delete them automatically as a part of test run

In **CI** the workflow runs `cleanup:crns` after a fully green run.

**Locally** After running the e2e suite, run `cleanup:crns` script to remove the offenders created

```bash
npm run cleanup:crns
```

Any crn that fail to delete stay in the file `created-crns.txt` for the next run. To target specific CRNs directly

```bash
CRNS=X123456,X654321 npm run cleanup:crns
```

## CI

The playwright workflow runs on a schedule and via manual `workflow_dispach`.

The dev and e2e test suite run as separate steps so each gets the right `ENV`.
**Cleanup runs only on a green run** (`if:success()`), so failed run leaves the crn for debugging

## Notes

Test data: The e2e suite creates its own offender in Delius per run. The checkin suites create a check in via the API
(`createEsupervisionCheckin`) for `TEST_CRN`, then drives the UI.
