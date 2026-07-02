const MAP: Record<string, string> = {
  VERY_WELL: "Very well",
  WELL: "Well",
  OK: "OK",
  NOT_GREAT: "Not great",
  STRUGGLING: "Struggling",
  MENTAL_HEALTH: "Mental health",
  ALCOHOL: "Alcohol",
  DRUGS: "Drugs",
  MONEY: "Money",
  HOUSING: "Housing",
  EMPLOYMENT_EDU: "Employment and education",
  SUPPORT_SYSTEM: "Relationships(family,friends,partner)",
  OTHER: "Something else",
  NO_HELP: "No, I do not need help",
};

export const label = (key: string): string => {
  if (!key) return "";
  return MAP[key.trim().toUpperCase()] ?? key;
};

const MPOP_ASSISTANCE_MAP: Record<string, string> = {
  MENTAL_HEALTH: "Mental health",
  ALCOHOL: "Alcohol",
  DRUGS: "Drugs",
  MONEY: "Money",
  HOUSING: "Housing",
  EMPLOYMENT_EDU: "Employment and education",
  SUPPORT_SYSTEM: "Relationships (family, friends, partner)",
  OTHER: "Other",
};

export const mpopAssistanceLabel = (key: string): string =>
  MPOP_ASSISTANCE_MAP[key.trim().toUpperCase()] ?? key;

const MPOP_ASSISTANCE_COMMENT_KEY: Record<string, string> = {
  MENTAL_HEALTH: "about mental health",
  ALCOHOL: "about alcohol",
  DRUGS: "about drugs",
  MONEY: "about money",
  HOUSING: "about housing",
  EMPLOYMENT_EDU: "about employment and education",
  SUPPORT_SYSTEM: "about their relationships",
  OTHER: "about (something else)",
};

export const mpopAssistanceCommentKey = (key: string): string =>
  MPOP_ASSISTANCE_COMMENT_KEY[key.trim().toUpperCase()] ?? key;
