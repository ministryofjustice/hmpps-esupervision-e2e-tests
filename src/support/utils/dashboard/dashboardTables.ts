import { expect, type Locator, type Page } from "@playwright/test";
import {
  expectedPercentage,
  parseCount,
  parsePercentage,
  percentageDrift,
  PERCENTAGE_TOLERANCE,
} from "./dashboardStatsValues";
import { normaliseWhitespace } from "./textMatching";

const BROKEN_VALUE = /NaN|undefined|Infinity|\[object/;

export const assertNoBrokenValues = async (page: Page): Promise<void> => {
  const main = page.locator("main");
  await expect(main, "the page should render exactly one <main>").toHaveCount(
    1,
  );
  expect(
    normaliseWhitespace(await main.innerText()),
    "a broken value reached the page",
  ).not.toMatch(BROKEN_VALUE);
};

export const normalisedTexts = (locator: Locator): Promise<string[]> =>
  locator.evaluateAll((cells) =>
    cells.map((cell) => (cell.textContent ?? "").replace(/\s+/g, " ").trim()),
  );

const isZero = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  const duration = trimmed.match(/^(\d+)h\s+(\d+)m$/);
  if (duration) return Number(duration[1]) === 0 && Number(duration[2]) === 0;
  const numeric = Number(trimmed.replace(/,/g, "").replace(/%$/, ""));
  return Number.isFinite(numeric) && numeric === 0;
};

export const assertHasData = (values: string[], context: string): void => {
  expect(
    values.some((value) => !isZero(value)),
    `${context}: every figure is zero, so the checks below would pass whatever the code did`,
  ).toBe(true);
};

export const assertCells = async (
  cells: Locator,
  columns: string[],
  expected: RegExp | string,
  context: string,
): Promise<void> => {
  const values = await normalisedTexts(cells);
  expect(
    values,
    `${context} has ${values.length} cells for ${columns.length} columns`,
  ).toHaveLength(columns.length);
  for (const [index, column] of columns.entries()) {
    const message = `${context} / ${column}`;
    if (typeof expected === "string") {
      expect(values[index], message).toEqual(expected);
    } else {
      expect(values[index], message).toMatch(expected);
    }
  }
};

export interface RowValue {
  label: string;
  total: string;
  percentage: string;
}

export const rowNamed = (
  rows: RowValue[],
  label: string,
  caption: string,
): RowValue => {
  const row = rows.find((candidate) => candidate.label === label);
  if (!row) {
    throw new Error(`${caption} / ${label} row missing`);
  }
  return row;
};

export const assertPercentageMatchesCount = (
  row: RowValue,
  denominator: number,
  context: string,
): void => {
  const shown = parsePercentage(row.percentage);
  if (shown === null) {
    throw new Error(`${context} / ${row.label} has no percentage`);
  }
  const count = parseCount(row.total);
  expect(
    percentageDrift(shown, count, denominator),
    `${context} / ${row.label} shows ${row.percentage} but its own count over ${denominator} gives ${expectedPercentage(count, denominator).toFixed(2)}%`,
  ).toBeLessThanOrEqual(PERCENTAGE_TOLERANCE);
};

export const answeredDenominator = (
  rows: RowValue[],
  notAnsweredLabel: string,
): number =>
  rows
    .filter((row) => row.label !== notAnsweredLabel)
    .reduce((sum, row) => sum + parseCount(row.total), 0);

export const parseRow = (
  cells: string[],
  columns: string[],
  context: string,
): number[] => {
  expect(
    cells,
    `${context} has ${cells.length} number cells for ${columns.length} columns${
      cells.length === 0 ? " — the row header fragment matched no row" : ""
    }`,
  ).toHaveLength(columns.length);
  return cells.map(parseCount);
};

const splitRow = (
  cells: string[],
  columns: string[],
  context: string,
): { total: number; summed: number } => {
  const [total, ...perRegion] = parseRow(cells, columns, context);
  return { total, summed: perRegion.reduce((sum, value) => sum + value, 0) };
};

export const assertRowSumsToTotal = (
  cells: string[],
  columns: string[],
  context: string,
): void => {
  const { total, summed } = splitRow(cells, columns, context);
  expect(
    summed,
    `${context} regions sum to ${summed} but the total is ${total}`,
  ).toEqual(total);
};

export const assertRowWithinTotal = (
  cells: string[],
  columns: string[],
  context: string,
): void => {
  const { total, summed } = splitRow(cells, columns, context);
  expect(
    summed,
    `${context} regions sum to ${summed}, which is more than the total of ${total}`,
  ).toBeLessThanOrEqual(total);
};
