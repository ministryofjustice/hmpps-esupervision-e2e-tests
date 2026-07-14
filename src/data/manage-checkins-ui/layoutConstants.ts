export const FEEDBACK_SURVEY_HREF = /smartsurvey\.co\.uk\/t\//;

export const BANNER_TEXT = "This is a new service";

export interface FooterLink {
  name: string;
  href: RegExp;
}

export const FOOTER_LINKS: FooterLink[] = [
  { name: "Accessibility", href: /accessibility/i },
  { name: "Cookies policy", href: /cookies/i },
  { name: "Privacy policy", href: /privacy/i },
];
