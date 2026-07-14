export const FEEDBACK_SURVEY_HREF = /smartsurvey\.co\.uk\/t\//;

export const BANNER_TEXT = "This is a new service";

export interface Footerlink {
  name: string;
  href: RegExp;
}

export const FOOTER_LINKS: Footerlink[] = [
  { name: "Accessibility", href: /accessibility/i },
  { name: "Cookies policy", href: /cookues/i },
  { name: "Privacy policy", href: /privacy/i },
];
