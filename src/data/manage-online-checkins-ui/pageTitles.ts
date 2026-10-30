export const MANAGE_ONLINE_CHECKINS_UI_SERVICENAME = "Manage online check ins";

export const manageCheckinsUiTitle = (pageTitleText: string): string =>
  `${pageTitleText} - ${MANAGE_ONLINE_CHECKINS_UI_SERVICENAME}`;

export const ADD_QUESTIONS_TITLE =
  "Add questions to the person's online check in";

export const CHOOSE_QUESTION_TITLE =
  "Choose a question to add or write your own";

export const WRITE_OWN_QUESTION_TITLE = "Write your own question";

export const questionPreviewTitle = (questionText: string): string =>
  `Question preview of ${questionText}`;

export const REVIEW_IDENTITY_TITLE = "Review and confirm identity";
export const REVIEW_QUESTIONS_TITLE = "Review questions";
export const REVIEWED_CHECK_IN_TITLE = "Online check in submitted and reviewed";
export const MISSED_CHECK_IN_TITLE = "Online check in missed";
export const MISSED_REVIEWED_CHECK_IN_TITLE =
  "Online check in missed and reviewed";

export const STOP_CHECKINS_TITLE = "Stop online check ins for the person";
export const CONTACT_PREFERENCE_TITLE =
  "How does the person want us to send a link to the service?";

export const EDIT_CONTACT_DETAILS_TITLE = "Edit contact details for the person";

// Setup wizard eligibility pages.
export const ELIGIBILITY_CHECK_TITLE = "Check if the person is eligible";
export const PILOT_CHECK_TITLE =
  "Do you have one or more people who started using online check ins before 1 October 2026?";
export const IS_ELIGIBLE_TITLE =
  "The person is eligible to use online check ins";
export const ACCREDITED_PROGRAMME_IS_ELIGIBLE_TITLE =
  "The person is eligible to use online check ins to reduce in person appointments to monthly";
export const NOT_ELIGIBLE_TITLE =
  "The person is not eligible to use online check ins";
export const DISCUSS_BEFORE_SIGNUP_TITLE =
  "You should speak to the person about online check ins before you sign them up";
export const ACCREDITED_PROGRAMME_APPROVAL_TITLE =
  "Confirm you’ve discussed this case with the accredited programme treatment manager";

export const errorTitle = (pageTitleText: string): string =>
  `Error: ${pageTitleText}`;

export const confirmContactDetailTitle = (
  detail: "email address" | "mobile number",
): string => `Confirm the person's ${detail}`;

const EDIT_QUESTION_TITLES: Record<string, string> = {
  "How is": "How is [insert text]?",
  "been going recently": "How has [insert text] been going recently?",
  "Have you been able to": "Have you been able to [insert text]?",
  "been feeling": "How have things been feeling [insert text] recently?",
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
