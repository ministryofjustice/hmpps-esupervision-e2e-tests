export interface FooterLink {
  name: string;
  href: RegExp;
}

export const FEEDBACK_SURVEY_HREF = /smartsurvey\.co\.uk\/t\//;

export const BANNER_TEXT = "This is a new service";

export const FOOTER_LINKS: FooterLink[] = [
  { name: "Accessibility statement", href: /accessibility/i },
  { name: "Privacy", href: /privacy-notice/i },
];

export const DATA_DASHBOARD_HEADING =
  "Check in with your probation officer data dashboard";

export const SERVICE_NAME = "Check in with your probation officer";

export const PAGE_TITLE = SERVICE_NAME;

export const PHASE_TAG = "Private Beta";
