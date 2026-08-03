export const parseCount = (text: string): number => {
  const value = Number(text.trim().replace(/,/g, ""));

  if (Number.isNaN(value)) {
    throw new Error(`Expected a number but the cell read "${text}"`);
  }

  return value;
};

/** "12.34%" -> 12.34. Returns null for the em dash used where there is none. */
export const parsePercentage = (text: string): number | null => {
  const trimmed = text.trim();

  if (!trimmed.endsWith("%")) return null;

  return parseCount(trimmed.slice(0, -1));
};

/**
 * The service renders percentages with `(ratio * 100).toFixed(2)`, so a value
 * recomputed from the displayed count and denominator can differ in the last
 * decimal place through rounding alone. A hundredth of a percentage point is
 * wide enough to absorb that and far too narrow to hide a wrong denominator.
 */
export const PERCENTAGE_TOLERANCE = 0.01;

export const expectedPercentage = (
  count: number,
  denominator: number,
): number => (denominator === 0 ? 0 : (count / denominator) * 100);

/** Difference between a displayed percentage and one recomputed from counts. */
export const percentageDrift = (
  shown: number,
  count: number,
  denominator: number,
): number => Math.abs(shown - expectedPercentage(count, denominator));
