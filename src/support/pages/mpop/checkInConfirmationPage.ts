import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class CheckInConfirmationPage extends MPopBasePage {
  constructor(page: Page, restart = false) {
    super(
      page,
      restart ? "Online check ins restarted" : "Online check ins added",
    );
  }
}
