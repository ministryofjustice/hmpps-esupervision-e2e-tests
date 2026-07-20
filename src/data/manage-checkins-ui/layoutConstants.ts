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

export const MANAGE_ONLINE_CHECKINS_UI_SERVICENAME = "Manage online check ins";

export const manageCheckinsUiTitle = (pageTitleText: string): string =>
  `${pageTitleText} - ${MANAGE_ONLINE_CHECKINS_UI_SERVICENAME}`;

export const ADD_QUESTIONS_TITLE =
  "Add questions to the person's next online check in";
