import { expect, Page } from "@playwright/test"
import { CheckinPerson } from "./submit-online-checkin.spec";
import { AssistanceSelection } from "../../../../support/models/assistance";
import { MentalHealthOption } from "../../../../support/models/mentalHealth";
import PersonalDetailsPage from "../../../../support/pageObjects/checkin-ui/personalDetailsPage";
import { dobParts } from "../../../../support/utils/date";
import { CheckinPages } from "../../../../support/pageObjects/checkin-ui/checkinPages";


   const baseUrl = (): string => {
        if (!process.env.PROBATION_CHECK_IN_URL)
    throw new Error("PROBATION_CHECK_IN_URL env var is not set");
  console.log(process.env.PROBATION_CHECK_IN_URL);
  return  process.env.PROBATION_CHECK_IN_URL;
}


export default class CheckinSteps {
    readonly pages: CheckinPages

    constructor(private readonly page: Page) {
        this.pages = new CheckinPages(page)
    } 

    async goToCheckin(): Promise<void> {
       // const url =`${this.getBaseUrl()}/${uuid}`

       const url=''

        console.log(url)
        await this.page.goto(url)
    }

    // async goToLivenessView(uuid:string): Promise<void> {
    //     await this.page.goto()
    // }

    async clickStart():Promise<void>{
        await this.pages.checkinIndex.clickStart()
    }

    async completePersonalDetails(
      page: Page,
      person: CheckinPerson,
    ): Promise<void> {
      const { day, month, year } = dobParts(person.dob);
      await new PersonalDetailsPage(page).completeFormAndContinue({
        firstName: person.firstName,
        lastName: person.lastName,
        day,
        month,
        year,
      })
    }

    async completeMentalHealth(option:MentalHealthOption):Promise<void>{
         await this.pages.mentalHealth.selectOptionAndContinue(option)
    }

       async completeAssistance(selections: AssistanceSelection[]):Promise<void>{
         await this.pages.assistance.selectOptionsAndContinue(selections)
    }

     async completeConfirmIdentity():Promise<void>{
         await this.pages.livenessInform.clickContinue()
    }

    async goToLivenessView(uuid:string): Promise<void> {
      await this.page.goto(`${baseUrl()}/${uuid}/liveness/view`)
    }


    async goToVideoView(uuid:string): Promise<void> {
      await this.page.goto(`${baseUrl()}/${uuid}/liveness/view`)
    }

    async completeLivenessDev(uuid:string):Promise<void>{
         await this.goToVideoView(uuid)
         await expect(this.pages.videoView.heading()).toContainText('We cannot confirm this is you')

    }



}