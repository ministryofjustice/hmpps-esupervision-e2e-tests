import { Page } from "@playwright/test";
import CheckinBasePage from "../base/checkinBasePage";

export default class FallbackInformPage extends CheckinBasePage {
  constructor(page: Page) {
    super(page, "Confirm your identity");
  }
}
