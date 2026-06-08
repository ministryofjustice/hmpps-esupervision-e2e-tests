import { expect, Locator, Page } from "@playwright/test";
import CheckinBasePage from "./checkinBasePage";


export interface PersonDetails {
firstName:string
lastName:string
day:string
month:string
year:string
}

export default class PersonalDetailsPage extends CheckinBasePage {
      constructor(page: Page) {
           super(page,'Personal details')
       }

  firstNameField(): Locator { return this.getByID('firstName') }
  lastNameField(): Locator  { return this.getByID('lastName') }
  dayField(): Locator       { return this.page.locator('[name="day"]') }
  monthField(): Locator     { return this.page.locator('[name="month"]') }
  yearField(): Locator      { return this.page.locator('[name="year"]') }

  
  async completeForm(details: PersonDetails): Promise<void> {
    await this.firstNameField().fill(details.firstName)
    await this.lastNameField().fill(details.lastName)
    await this.dayField().fill(details.day)
    await this.monthField().fill(details.month)
    await this.yearField().fill(details.year)
  }

  async completeFormAndContinue(details: PersonDetails): Promise<void> {
    await this.completeForm(details)
    await this.clickContinue()
  }
}
