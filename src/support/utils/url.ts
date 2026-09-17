/** Escape a value for literal use inside a RegExp. */
export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const trimTrailingSlash = (base: string): string => base.replace(/\/$/, "");

/** `<base><path>` as one exact string, with any trailing slash on the base
 *  removed. For an href you expect character for character, or a URL to
 *  navigate to. To match where a browser *ended up*, use `urlPattern`,
 *  `urlPathPattern` or `originPattern` instead. */
export const absoluteUrl = (base: string, path = ""): string =>
  `${trimTrailingSlash(base)}${path}`;

/** Matches the start of a URL, so anything may follow. Use it when the path
 *  really does continue - an id or a nested page comes next - or when the test
 *  also checks the page that rendered, the way followToMpop's `landedOn` does.
 *  If the URL should end there, use `urlPathPattern`: a prefix match would take
 *  `/caseload` for `/case`. */
export const urlPattern = (base: string, path = ""): RegExp =>
  new RegExp(`^${escapeRegExp(trimTrailingSlash(base))}${escapeRegExp(path)}`);

/** Matches base + path and nothing beyond it, give or take a trailing slash or a
 *  query string. Use it when the URL should end there, so `/case` can't be
 *  satisfied by `/caseload` or by one case's own page. */
export const urlPathPattern = (base: string, path = ""): RegExp =>
  new RegExp(
    `^${escapeRegExp(trimTrailingSlash(base))}` +
      `${escapeRegExp(trimTrailingSlash(path))}/?($|[?#])`,
  );

/** The offender UUID out of a manage URL - `.../check-in/manage/{uuid}/...`. That
 *  segment is the offender's own uuid, not a per-check-in id. Lets a test assert a
 *  manage href exactly instead of by prefix; both services mirror this path, so it
 *  reads from either one's URL. */
export const offenderUuidFrom = (url: string): string => {
  const uuid = /\/check-in\/manage\/([^/?#]+)/.exec(url)?.[1];
  if (!uuid) {
    throw new Error(`No offender UUID in "${url}" - not a manage page URL`);
  }
  return uuid;
};

/** Origin match: `^<base>` followed by `/` or end of string. Not anchored at the
 *  end, so it matches any path on that origin - it answers "which service served
 *  this?", not "which page?". Use `urlPattern` when the path matters. */
export const originPattern = (base: string): RegExp =>
  new RegExp(`^${escapeRegExp(trimTrailingSlash(base))}(/|$)`);
