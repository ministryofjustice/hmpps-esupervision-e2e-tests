import { spawnSync } from "node:child_process";

// npm run create:<kind>-crn -- [--count <n>] [other Playwright options, e.g. --headed]
// Each kind is a src/data-setup/create-<kind>-crn.setup.ts file.
const KINDS = ["final-third", "recalled"] as const;

const [kind, ...args] = process.argv.slice(2);
if (!KINDS.includes(kind as (typeof KINDS)[number])) {
  console.error(
    `Unknown CRN kind "${kind ?? ""}"; expected one of: ${KINDS.join(", ")}`,
  );
  process.exit(1);
}

let count = "1";
const passThrough: string[] = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--count") {
    count = args[++i] ?? "";
  } else if (arg.startsWith("--count=")) {
    count = arg.slice("--count=".length);
  } else {
    passThrough.push(arg);
  }
}
if (!/^[1-9]\d*$/.test(count)) {
  console.error(`--count must be a whole number of 1 or more, not "${count}"`);
  process.exit(1);
}

const result = spawnSync(
  "npx",
  [
    "playwright",
    "test",
    `src/data-setup/create-${kind}-crn.setup.ts`,
    "--project=data-setup",
    // Line reporter only: skips the cleanup reporter, so the CRNs are kept.
    "--reporter=line",
    ...passThrough,
  ],
  {
    stdio: "inherit",
    env: { ...process.env, DATA_SETUP: "1", CRN_COUNT: count },
  },
);
process.exit(result.status ?? 1);
