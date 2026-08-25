/** Escape a value for literal use inside a RegExp. */
export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const trimTrailingSlash = (base: string): string => base.replace(/\/$/, "");

/** `^<base><path>`, both escaped, with any trailing slash on the base removed. */
export const urlPattern = (base: string, path = ""): RegExp =>
  new RegExp(`^${escapeRegExp(trimTrailingSlash(base))}${escapeRegExp(path)}`);

// TODO(legacy-mpop): Delete originPattern when legacy MPOP is removed - only
// legacyMpop.ts uses it. escapeRegExp and urlPattern are used by MOCI code and stay.
/** `^<base>` followed by `/` or end of string - the origin and nothing beyond it. */
export const originPattern = (base: string): RegExp =>
  new RegExp(`^${escapeRegExp(trimTrailingSlash(base))}(/|$)`);
