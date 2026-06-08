import { expect, Page } from "@playwright/test";
import PopBasePage from "./checkinBasePage";
import CheckinBasePage from "./checkinBasePage";

export default class ConfirmationPage extends CheckinBasePage  {
constructor(page: Page) {
      super(page, 'Check in completed')
     }
   
}
