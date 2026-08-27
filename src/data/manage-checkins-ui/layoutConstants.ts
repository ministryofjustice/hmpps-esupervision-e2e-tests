/**
 * MPOP's banner is identical apart from the survey's `service` parameter, so that
 * parameter is the only proof this service's own link is in use.
 */
export const FEEDBACK_SURVEY_HREF =
  /smartsurvey\.co\.uk\/t\/.*service=Online%20check%20ins/;

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
