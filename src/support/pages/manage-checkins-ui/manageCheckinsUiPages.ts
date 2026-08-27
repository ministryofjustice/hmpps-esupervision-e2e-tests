import { Page } from "@playwright/test";
import Header from "./header";
import Footer from "./footer";
import FeedbackBanner from "./feedbackBanner";
import ContactPreferencePage from "./contactPreferencePage";
import ContactDetailsPage from "./contactDetailsPage";
import EditContactDetailsPage from "./editContactDetailsPage";

export class ManageCheckinsUiPages {
  readonly header: Header;
  readonly feedbackBanner: FeedbackBanner;
  readonly footer: Footer;
  readonly contactPreference: ContactPreferencePage;
  readonly contactDetails: ContactDetailsPage;
  readonly editContactDetails: EditContactDetailsPage;

  constructor(page: Page) {
    this.header = new Header(page);
    this.feedbackBanner = new FeedbackBanner(page);
    this.footer = new Footer(page);
    this.contactPreference = new ContactPreferencePage(page);
    this.contactDetails = new ContactDetailsPage(page);
    this.editContactDetails = new EditContactDetailsPage(page);
  }
}
