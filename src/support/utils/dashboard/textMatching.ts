const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const looseFragment = (...words: string[]): RegExp =>
  new RegExp(words.map(escapeRegExp).join("\\s*"), "i");

export const exactText = (value: string): RegExp =>
  new RegExp(`^\\s*${escapeRegExp(value.trim())}\\s*$`);

export const normaliseWhitespace = (text: string): string =>
  text.replace(/\s+/g, " ").trim();
