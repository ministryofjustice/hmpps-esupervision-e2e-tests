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

//substring of the MPOP "What they want us to know about.." comment-row key
// for each assistance option. SUPPORT_SYSTEM and OTHER are irregular: the
// template uses "their relationships" and "(something else)"

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

const lookup =
  (map: Record<string, string>) =>
  (key: string): string =>
    key ? (map[key.trim().toUpperCase()] ?? key) : "";

export const label = lookup(MAP);

export const mpopAssistanceLabel = lookup(MPOP_ASSISTANCE_MAP);

export const mpopAssistanceCommentKey = lookup(MPOP_ASSISTANCE_COMMENT_KEY);

export const welshHeadings = {
  home: "Cyfarfod diweddaru gyda’ch swyddog prawf",
  personalDetails: "Manylion personol",
  mentalHealth: "Sut ydych chi wedi bod yn teimlo ers i ni siarad ddiwethaf?",
  assistance:
    "Oes angen cymorth arnoch chi neu ydych chi eisiau rhoi gwybod i ni am unrhyw beth?",
  fallbackInform: "Cadarnhau pwy ydych chi",
  noMatch: "Ni allwn gadarnhau mai chi sydd yno",
  checkAnswers: "Gwiriwch eich atebion cyn cwblhau eich cyfarfod diweddaru",
  confirmation: "Wedi cwblhau’r cyfarfod diweddaru",
};
