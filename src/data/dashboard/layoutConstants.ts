export interface FooterLink {
  name: string;
  href: RegExp;
}

export const FOOTER_LINKS: FooterLink[] = [
  { name: "Accessibility statement", href: /accessibility/i },
  { name: "Privacy", href: /privacy-notice/i },
];

export const DATA_DASHBOARD_HEADING =
  "Check in with your probation officer data dashboard";

export const SERVICE_NAME = "Check in with your probation officer";

export const PHASE_TAG = "Private Beta";
