export const parseCount = (text: string): number => {
  const trimmed = text.trim().replace(/,/g, "");
  if (trimmed === "") {
    throw new Error("Expected a number but the cell was empty");
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    throw new Error(`Expected a number but the cell read "${text}"`);
  }
  return value;
};

export const parsePercentage = (text: string): number | null => {
  const trimmed = text.trim();
  if (!trimmed.endsWith("%")) return null;
  return parseCount(trimmed.slice(0, -1));
};

export const PERCENTAGE_TOLERANCE = 0.01;

export const expectedPercentage = (
  count: number,
  denominator: number,
): number => (denominator === 0 ? 0 : (count / denominator) * 100);

export const percentageDrift = (
  shown: number,
  count: number,
  denominator: number,
): number => Math.abs(shown - expectedPercentage(count, denominator));
