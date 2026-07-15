import { Page } from "@playwright/test";
import Header from "./header";
import Footer from "./footer";
import FeedbackBanner from "./feedbackBanner";

export class ManageCheckinsUiPages {
  readonly header: Header;
  readonly feedbackBanner: FeedbackBanner;
  readonly footer: Footer;

  constructor(page: Page) {
    this.header = new Header(page);
    this.feedbackBanner = new FeedbackBanner(page);
    this.footer = new Footer(page);
  }
}
