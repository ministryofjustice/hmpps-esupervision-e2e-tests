import { expect, Page } from "@playwright/test";
import PopBasePage from "./checkinBasePage";
import CheckinBasePage from "./checkinBasePage";

export default class ConfirmationPage extends CheckinBasePage  {
constructor(page: Page) {
         super(page)
     }

    async assertOnPage() {
      await expect(this.page.getByRole("heading",{ name:"Check in completed"})).toBeVisible()
    }
   
}
