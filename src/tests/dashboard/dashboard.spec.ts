import test, { expect, Page } from "@playwright/test";
import DashboardJourney from "../../support/journeys/dashboard/dashboardJourney";
import { DashboardPages } from "../../support/pages/dashboard/dashboardPages";
import {
  CHECKIN_ROW_LABELS,
  DATA_DASHBOARD_HEADING,
  DURATION_FORMAT,
  DURATION_ROWS,
  EARLIEST_MONTH,
  EM_DASH,
  FEEDBACK_NOT_ANSWERED_ROW,
  FEEDBACK_RESPONSES_ROW_LABELS,
  FEEDBACK_TABLE_ROWS,
  FEEDBACK_TABLES,
  FEEDBACK_TOTAL_ROW,
  NUMBER_FORMAT,
  PEOPLE_ROW_LABELS,
  PERCENTAGE_FORMAT,
  REGION_CHECKIN_ROWS,
  REGION_MATRIX_CHECKINS,
  REGION_MATRIX_PEOPLE,
  REGION_NAMES_EXCLUDED_FROM_SUM,
  REGION_PEOPLE_ROWS,
  REGION_ROWS_WITH_PROVIDER_COLLISION,
  REGION_ROWS_WITHOUT_PERCENTAGE,
  REGION_SUMMABLE_ROWS,
  ROW_ACTIVE,
  ROW_CHECKINS_COMPLETED,
  ROW_CHECKINS_NOT_COMPLETED,
  ROW_SIGNED_UP,
  ROW_STOPPED,
  TABLE_CHECKINS,
  TABLE_FEEDBACK_RESPONSES,
  TABLE_IMPROVEMENTS,
  TABLE_PEOPLE,
} from "../../data/dashboard/dataDashboardConstants";
import { currentMonth } from "../../support/utils/month";
import {
  expectedPercentage,
  parseCount,
  parsePercentage,
  percentageDrift,
  PERCENTAGE_TOLERANCE,
} from "../../support/utils/dashboardStatsValues";

/* Tests 1-3 cover rendering and the month filter. Tests 4-6 check correctness
without a second source of truth, by asserting relationships that must hold
between figures already on the page, so they stay valid whatever the underlying
data happens to be. Test 7 cross-checks the region tab's Total column against
the Overall tab, since both should show the same nationwide figures. */
test.describe("data dashboard", () => {
  let page: Page;
  let pages: DashboardPages;
  let journey: DashboardJourney;

  const thisMonth = currentMonth();

  const matrices = [
    { title: REGION_MATRIX_PEOPLE, rows: REGION_PEOPLE_ROWS },
    { title: REGION_MATRIX_CHECKINS, rows: REGION_CHECKIN_ROWS },
  ];

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    journey = new DashboardJourney(page);
    pages = await journey.signIn();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("overall tab shows every figure for the default month range", async () => {
    await journey.openOverall();

    await expect(pages.overall.pageHeading()).toHaveText(
      DATA_DASHBOARD_HEADING,
    );
    await pages.overall.assertSelectedRange(EARLIEST_MONTH, thisMonth);

    // The date is rendered with an explicit en-GB locale; the time is not, so it
    // is asserted only as a clock time rather than a specific format.
    await expect(pages.overall.lastUpdated()).toHaveText(
      /last updated on \d{2}\/\d{2}\/\d{4} at \d{1,2}:\d{2}:\d{2}/,
    );

    const tablesWithRows = [
      {
        caption: TABLE_PEOPLE,
        rows: PEOPLE_ROW_LABELS,
        hasPercentageColumn: true,
        rowsWithoutPercentage: [ROW_SIGNED_UP],
      },
      {
        caption: TABLE_CHECKINS,
        rows: CHECKIN_ROW_LABELS,
        hasPercentageColumn: true,
        rowsWithoutPercentage: CHECKIN_ROW_LABELS.filter(
          (label) =>
            label !== ROW_CHECKINS_COMPLETED &&
            label !== ROW_CHECKINS_NOT_COMPLETED,
        ),
      },
      {
        caption: TABLE_FEEDBACK_RESPONSES,
        rows: FEEDBACK_RESPONSES_ROW_LABELS,
        hasPercentageColumn: false,
        rowsWithoutPercentage: [],
      },
      ...FEEDBACK_TABLE_ROWS.map((table) => ({
        ...table,
        hasPercentageColumn: true,
        rowsWithoutPercentage: [FEEDBACK_NOT_ANSWERED_ROW],
      })),
    ];

    for (const {
      caption,
      rows,
      hasPercentageColumn,
      rowsWithoutPercentage,
    } of tablesWithRows) {
      await test.step(`"${caption}" table`, async () => {
        await expect(
          pages.overall.table(caption),
          `${caption} table`,
        ).toBeVisible();

        expect(
          await pages.overall.rowLabels(caption),
          `${caption} rows`,
        ).toEqual(rows);

        for (const label of rows) {
          await expect(
            pages.overall.totalCell(caption, label),
            `${caption} / ${label}`,
          ).toHaveText(
            DURATION_ROWS.includes(label) ? DURATION_FORMAT : NUMBER_FORMAT,
          );

          if (!hasPercentageColumn) continue;

          const percentageCell = pages.overall.percentageCell(caption, label);
          await expect(
            percentageCell,
            `${caption} / ${label} percentage`,
          ).toHaveText(
            rowsWithoutPercentage.includes(label) ? "" : PERCENTAGE_FORMAT,
          );
        }
      });
    }

    expect(
      await page.locator("main").innerText(),
      "a broken value reached the page",
    ).not.toMatch(/NaN|undefined|Infinity|\[object/);
  });

  test("region matrix shows a value under every region column", async () => {
    await journey.openByRegion();

    const regions = await pages.region.regionNames(REGION_MATRIX_PEOPLE);
    expect(regions.length, "no region columns rendered").toBeGreaterThan(0);
    expect(regions, "a region column has no heading").not.toContain("");

    for (const { title, rows } of matrices) {
      await test.step(`"${title}" matrix`, async () => {
        await expect(
          pages.region.matrixTitle(title),
          `${title} matrix`,
        ).toBeVisible();

        expect(
          await pages.region.regionNames(title),
          `${title} regions differ from the first matrix`,
        ).toEqual(regions);

        for (const label of rows) {
          const numbers = pages.region.numberCells(title, label);
          const percentages = pages.region.percentageCells(title, label);

          // One cell for the Total plus one per region. A mismatch means the row
          // no longer lines up with the column headings above it.
          await expect(numbers, `${title} / ${label} number cells`).toHaveCount(
            regions.length + 1,
          );
          await expect(
            percentages,
            `${title} / ${label} percentage cells`,
          ).toHaveCount(regions.length + 1);

          const isDuration = /median|P90/.test(label.source);
          const hasPercentage = !REGION_ROWS_WITHOUT_PERCENTAGE.some(
            (pattern) => pattern.source === label.source,
          );

          for (let index = 0; index <= regions.length; index += 1) {
            const column = index === 0 ? "Total" : regions[index - 1];

            await expect(
              numbers.nth(index),
              `${title} / ${label} / ${column}`,
            ).toHaveText(isDuration ? DURATION_FORMAT : NUMBER_FORMAT);

            await expect(
              percentages.nth(index),
              `${title} / ${label} / ${column} percentage`,
            ).toHaveText(hasPercentage ? PERCENTAGE_FORMAT : EM_DASH);
          }
        }
      });
    }

    expect(
      await page.locator("main").innerText(),
      "a broken value reached the page",
    ).not.toMatch(/NaN|undefined|Infinity|\[object/);
  });

  test("narrowing the month range changes the figures", async () => {
    await journey.openOverall(EARLIEST_MONTH, thisMonth);
    const fullRange = await pages.overall.allTotals();

    // A dashboard showing nothing but zeroes cannot demonstrate that the filter
    // works, and is itself worth failing on rather than skipping past.
    expect(
      fullRange.some((value) => value !== "0" && value !== "0h 0m"),
      "the full range returned no data at all",
    ).toBe(true);

    // Use the first month, not the current one, so the test can't pass by
    // accident just because all the data happens to be in the current month.
    await journey.applyRange(EARLIEST_MONTH, EARLIEST_MONTH);

    await expect(page).toHaveURL(
      new RegExp(`monthFrom=${EARLIEST_MONTH}&monthTo=${EARLIEST_MONTH}`),
    );
    await pages.overall.assertSelectedRange(EARLIEST_MONTH, EARLIEST_MONTH);
    expect(
      await pages.overall.allTotals(),
      "a single month returned the same figures as the full range",
    ).not.toEqual(fullRange);
  });

  // Checks the Overall tab is internally consistent: active plus stopped
  // adds up to signed up, every percentage matches its own count and
  // denominator, and feedback answers add up to the number of responses.
  test("overall counts and percentages agree with each other", async () => {
    await journey.openOverall();

    const people = await pages.overall.rowValues(TABLE_PEOPLE);
    const valueOf = (label: string) => {
      const row = people.find((candidate) => candidate.label === label);
      expect(row, `${label} row missing`).toBeDefined();
      return row as (typeof people)[number];
    };

    const signedUp = parseCount(valueOf(ROW_SIGNED_UP).total);
    const active = valueOf(ROW_ACTIVE);
    const stopped = valueOf(ROW_STOPPED);

    await test.step("active plus stopped equals the number signed up", async () => {
      expect(
        parseCount(active.total) + parseCount(stopped.total),
        "active plus stopped does not equal the number signed up",
      ).toEqual(signedUp);
    });

    await test.step("active and stopped percentages match their own counts", async () => {
      // Both percentages are stated as a share of people, and that population is
      // on the page directly above them.
      for (const row of [active, stopped]) {
        const shown = parsePercentage(row.percentage);
        expect(shown, `${row.label} has no percentage`).not.toBeNull();
        expect(
          percentageDrift(shown as number, parseCount(row.total), signedUp),
          `${row.label} shows ${row.percentage} but its own count gives ${expectedPercentage(parseCount(row.total), signedUp).toFixed(2)}%`,
        ).toBeLessThanOrEqual(PERCENTAGE_TOLERANCE);
      }
    });

    await test.step("check-in percentages match their own counts", async () => {
      const checkins = await pages.overall.rowValues(TABLE_CHECKINS);
      const valueOfCheckin = (label: string) => {
        const row = checkins.find((candidate) => candidate.label === label);
        expect(row, `${label} row missing`).toBeDefined();
        return row as (typeof checkins)[number];
      };

      const completed = valueOfCheckin(ROW_CHECKINS_COMPLETED);
      const notCompleted = valueOfCheckin(ROW_CHECKINS_NOT_COMPLETED);
      const totalCheckins =
        parseCount(completed.total) + parseCount(notCompleted.total);

      // Completed and not-completed-on-time are each a share of all check ins
      // due, i.e. each other's counts added together.
      for (const row of [completed, notCompleted]) {
        const shown = parsePercentage(row.percentage);
        expect(shown, `${row.label} has no percentage`).not.toBeNull();
        expect(
          percentageDrift(
            shown as number,
            parseCount(row.total),
            totalCheckins,
          ),
          `${row.label} shows ${row.percentage} but its own count gives ${expectedPercentage(parseCount(row.total), totalCheckins).toFixed(2)}%`,
        ).toBeLessThanOrEqual(PERCENTAGE_TOLERANCE);
      }
    });

    const feedbackTotal = parseCount(
      await pages.overall
        .totalCell(TABLE_FEEDBACK_RESPONSES, FEEDBACK_TOTAL_ROW)
        .innerText(),
    );

    for (const caption of FEEDBACK_TABLES) {
      await test.step(`"${caption}" answers agree with the number of responses`, async () => {
        const rows = await pages.overall.rowValues(caption);
        let counted = 0;

        for (const row of rows) {
          const count = parseCount(row.total);
          counted += count;

          // The last row of each table is "Not answered", which the template
          // leaves without a percentage.
          const shown = parsePercentage(row.percentage);
          if (shown === null) continue;

          expect(
            percentageDrift(shown, count, feedbackTotal),
            `${caption} / ${row.label} shows ${row.percentage} but its own count gives ${expectedPercentage(count, feedbackTotal).toFixed(2)}%`,
          ).toBeLessThanOrEqual(PERCENTAGE_TOLERANCE);
        }

        // How easy and getting support are single-answer questions, so their rows
        // partition the responses. Improvements allows several answers per
        // response, so its counts can only be bounded.
        if (caption === TABLE_IMPROVEMENTS) {
          expect(
            counted,
            `${caption} counts exceed the number of responses`,
          ).toBeGreaterThanOrEqual(feedbackTotal);
        } else {
          expect(
            counted,
            `${caption} answers do not add up to the number of responses`,
          ).toEqual(feedbackTotal);
        }
      });
    }
  });

  test("region counts sum to their totals", async () => {
    await journey.openByRegion();

    const regions = await pages.region.regionNames(REGION_MATRIX_PEOPLE);
    expect(regions.length, "no region columns rendered").toBeGreaterThan(0);

    for (const { title, rows } of matrices) {
      const summable = rows.filter((label) =>
        REGION_SUMMABLE_ROWS.some((pattern) => pattern.source === label.source),
      );

      await test.step(`"${title}" matrix sums to its totals`, async () => {
        for (const label of summable) {
          const cells = await pages.region
            .numberCells(title, label)
            .allInnerTexts();

          const [total, ...perRegion] = cells.map(parseCount);

          // Known API bug on these rows only - see REGION_NAMES_EXCLUDED_FROM_SUM.
          const excludeUnmapped = REGION_ROWS_WITH_PROVIDER_COLLISION.some(
            (pattern) => pattern.source === label.source,
          );
          const summed = perRegion.reduce(
            (sum, value, index) =>
              excludeUnmapped &&
              REGION_NAMES_EXCLUDED_FROM_SUM.includes(regions[index])
                ? sum
                : sum + value,
            0,
          );

          expect(
            summed,
            `${title} / ${label} regions sum to ${summed} but the total is ${total}`,
          ).toEqual(total);
        }
      });
    }
  });

  test("region active plus stopped equals signed up", async () => {
    await journey.openByRegion();

    const regions = await pages.region.regionNames(REGION_MATRIX_PEOPLE);
    const columns = ["Total", ...regions];
    const [signedUpRow, activeRow, stoppedRow] = REGION_PEOPLE_ROWS;

    const signedUp = (
      await pages.region
        .numberCells(REGION_MATRIX_PEOPLE, signedUpRow)
        .allInnerTexts()
    ).map(parseCount);
    const active = (
      await pages.region
        .numberCells(REGION_MATRIX_PEOPLE, activeRow)
        .allInnerTexts()
    ).map(parseCount);
    const stopped = (
      await pages.region
        .numberCells(REGION_MATRIX_PEOPLE, stoppedRow)
        .allInnerTexts()
    ).map(parseCount);

    // Test 5 only checks each row sums across regions to its total.
    // This checks the identity within each region column, which would still
    // pass test 5 if a person were counted under the wrong region.
    for (let index = 0; index < columns.length; index += 1) {
      expect(
        active[index] + stopped[index],
        `${columns[index]}: active (${active[index]}) + stopped (${stopped[index]}) should equal signed up (${signedUp[index]})`,
      ).toEqual(signedUp[index]);
    }
  });

  // The region tab's Total column and the Overall tab both show the same
  // nationwide figures, just on different pages. A mismatch means one page is
  // showing stale or differently-sourced data from the other.
  test("region total column matches the overall tab", async () => {
    await journey.openOverall();

    const overallPeople = await Promise.all(
      PEOPLE_ROW_LABELS.map((label) =>
        pages.overall.totalCell(TABLE_PEOPLE, label).innerText(),
      ),
    );
    const overallCheckins = await Promise.all(
      CHECKIN_ROW_LABELS.map((label) =>
        pages.overall.totalCell(TABLE_CHECKINS, label).innerText(),
      ),
    );

    await journey.openByRegion();

    const tables = [
      {
        matrix: REGION_MATRIX_PEOPLE,
        rows: REGION_PEOPLE_ROWS,
        overall: overallPeople,
      },
      {
        matrix: REGION_MATRIX_CHECKINS,
        rows: REGION_CHECKIN_ROWS,
        overall: overallCheckins,
      },
    ];

    for (const { matrix, rows, overall } of tables) {
      for (let index = 0; index < rows.length; index += 1) {
        const regionTotal = (
          await pages.region.numberCells(matrix, rows[index]).nth(0).innerText()
        ).trim();
        const overallTotal = overall[index].trim();

        expect(
          regionTotal,
          `${matrix} / ${rows[index]}: region Total is ${regionTotal} but the overall tab shows ${overallTotal}`,
        ).toEqual(overallTotal);
      }
    }
  });
});
