export const MANAGE_ONLINE_CHECKINS_UI_SERVICENAME = "Manage online check ins";

export const manageCheckinsUiTitle = (pageTitleText: string): string =>
  `${pageTitleText} - ${MANAGE_ONLINE_CHECKINS_UI_SERVICENAME}`;

export const HOW_TO_WRITE_QUESTIONS_TITLE =
  "How to write questions for an online service";

export const ADD_QUESTIONS_TITLE =
  "Add questions to the person's next online check in";

export const CHOOSE_QUESTION_TITLE = ADD_QUESTIONS_TITLE;

export const questionPreviewTitle = (questionText: string): string =>
  `Question preview of ${questionText}`;

export const REVIEW_IDENTITY_TITLE = "Review and confirm identity";
export const REVIEW_QUESTIONS_TITLE = "Review questions";
export const REVIEWED_CHECK_IN_TITLE = "Online check in submitted and reviewed";

export const STOP_CHECKINS_TITLE = "Stop online check ins for the person";
export const CHECKIN_SETTINGS_TITLE = "Change online check in settings";
export const CONTACT_PREFERENCE_TITLE =
  "How does the person want us to send a link to the service?";

export const EDIT_CONTACT_DETAILS_TITLE = "Edit contact details for the person";

export const confirmContactDetailTitle = (
  detail: "email address" | "mobile number",
): string => `Confirm the person's ${detail}`;

const EDIT_QUESTION_TITLES: Record<string, string> = {
  "been going recently": "How has [insert text] been going recently?",
  "been feeling": "How have things been feeling [insert text] recently?",
  "How is": "How is [insert text]?",
  "Do you": "Do you [insert text]?",
  "What have you been doing at":
    "What have you been doing at [insert text] recently?",
  "Has anything changed": "Has anything changed with [insert text] recently?",
};

export const editQuestionTitle = (template: string): string => {
  const title = EDIT_QUESTION_TITLES[template];
  if (!title) {
    throw new Error(
      `No known edit-question title for template "${template}" - add it to EDIT_QUESTION_TITLES`,
    );
  }
  return title;
};
