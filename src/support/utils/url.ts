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

/**
 * The check in UUID out of a manage URL - `.../check-in/manage/{uuid}/...`.
 * Both services mirror this path, so it reads from either one's URL. Lets a test
 * assert a manage href exactly instead of by prefix.
 */
export const manageCheckinIdFrom = (url: string): string => {
  const id = /\/check-in\/manage\/([^/?#]+)/.exec(url)?.[1];
  if (!id) {
    throw new Error(`No check in UUID in "${url}" - not a manage page URL`);
  }
  return id;
};

/** Origin match: `^<base>` followed by `/` or end of string. Not anchored at the
 *  end, so it matches any path on that origin - it answers "which service served
 *  this?", not "which page?". Use `urlPattern` when the path matters. */
export const originPattern = (base: string): RegExp =>
  new RegExp(`^${escapeRegExp(trimTrailingSlash(base))}(/|$)`);
