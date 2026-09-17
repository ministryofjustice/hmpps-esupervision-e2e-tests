/** Escape a value for literal use inside a RegExp. */
export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const trimTrailingSlash = (base: string): string => base.replace(/\/$/, "");

/** `<base><path>` as an exact string, with any trailing slash on the base
 *  removed. For matching a rendered URL or an href, use `urlPattern` (prefix
 *  match) or `originPattern` (origin match) instead. */
export const absoluteUrl = (base: string, path = ""): string =>
  `${trimTrailingSlash(base)}${path}`;

/** Prefix match: `^<base><path>`, both escaped, with any trailing slash on
 *  the base removed. */
export const urlPattern = (base: string, path = ""): RegExp =>
  new RegExp(`^${escapeRegExp(trimTrailingSlash(base))}${escapeRegExp(path)}`);

/** Origin match: `^<base>` followed by `/` or end of string - the origin and
 *  nothing beyond it. */
export const originPattern = (base: string): RegExp =>
  new RegExp(`^${escapeRegExp(trimTrailingSlash(base))}(/|$)`);
