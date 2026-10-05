import { Page } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";

export default class ConfirmationPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, "Check in completed");
  }
}
