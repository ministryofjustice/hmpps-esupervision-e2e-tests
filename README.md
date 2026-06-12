# hmpps-esupervision-e2e-tests

Playwright E2E tests for online check ins and eSupervision user journeys

## Setup

```bash
npm install
npx playwright install
cp .env.example .env.dev   # then fill in the values
```

## Run

```bash
npm test            # run against dev (ENV=dev)
npm run test:headed # watch it run in a browser
npm run test:mpop  # run only mpop setup specs (src/tests/mpop)
npm run test:mpop:headed # run only mpop setup specs (src/tests/mpop) in browser
npm run report      # open the last HTML report
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

Configuration is read from `.env.${ENV}` (so `.env.dev`) via `src/config/env.ts`.

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


## Notes

- Test data: each run creates its own check in via the API
  (`createEsupervisionCheckin`) for `TEST_CRN`, then drives the UI.
