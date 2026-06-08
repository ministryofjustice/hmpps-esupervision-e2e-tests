import { test, expect } from "@playwright/test";

import CheckinSteps from "./checkInSteps";
import { randomAssistanceSelections } from "../../../../support/models/assistance";
import { randomMentalHealthOption } from "../../../../support/models/mentalHealth";
import { data } from "../../../test-data/test-data";
import { randomUUID } from "crypto";


let uuid: string;

export interface CheckinPerson {
  firstName: string;
  lastName: string;
  dob: Date;
}

const checkinPerson = {
  firstName: data.data.firstName,
  lastName: data.data.lastName,
  dob: data.data.dob,
};

const mentalHealth = randomMentalHealthOption();
const assistance = randomAssistanceSelections(2);
const crn = data.data.crn;

test.beforeAll(async () => {
  // const uiDueDate = getWorkingDayForEsupervision(1);
  // const apiDueDate = uiDateToIso(uiDueDate);
  // console.log(apiDueDate);
  // const token = await getToken();
  // // uuid = await createOffenderCheckin(crn, apiDueDate);
  // uuid = await createEsupervisionCheckin(crn, dueDateString(today), token);
  // console.log(` Checkin created — UUID: ${uuid}`);
  // console.log(`URL: ${process.env.PROBATION_CHECK_IN_URL}/${uuid}`);
});

const baseUrl = (): string => {
  if (!process.env.PROBATION_CHECK_IN_URL)
    throw new Error("PROBATION_CHECK_IN_URL env var is not set");
  console.log(process.env.PROBATION_CHECK_IN_URL);
  return process.env.PROBATION_CHECK_IN_URL;
};

// export const goToCheckin = async (
//   page: Page,
//   uuid: string,
// ): Promise<CheckInIndexPage> => {
//   await page.goto(`${baseUrl()}/${uuid}`);
//   return new CheckInIndexPage(page);
// };

// export const completePersonalDetails = async (
//   page: Page,
//   person: CheckinPerson,
// ): Promise<void> => {
//   const { day, month, year } = dobParts(person.dob);
//   await new PersonalDetailsPage(page).completeFormAndContinue({
//     firstName: person.firstName,
//     lastName: person.lastName,
//     day,
//     month,
//     year,
//   });
// };

test("submit a check in end to end", async ({ page }) => {
  const steps = new CheckinSteps(page)
  const pages =  steps.pages
  // await steps.goToCheckin(uuid)
  await steps.goToCheckin()
  await expect(pages.checkinIndex.page.locator("h1")).toContainText(
    "Check in with your probation officer",
  );
  await expect(pages.checkinIndex.startButton()).toContainText("Start now");
  await steps.clickStart();
  console.log(process.env.ENV)
  console.log(checkinPerson)
  await steps.completePersonalDetails(page, checkinPerson);

  await expect(pages.mentalHealth.veryWellRadio()).toBeVisible()
  await expect(pages.mentalHealth.WellRadio()).toBeVisible()
  await expect(pages.mentalHealth.okRadio()).toBeVisible()
  await expect(pages.mentalHealth.notGreatRadio()).toBeVisible()
  await expect(pages.mentalHealth.strugglingRadio()).toBeVisible()
  await steps.completeMentalHealth(mentalHealth)
   await page.pause()

  await steps.completeAssistance(assistance)
  await page.pause()

  await steps.completeConfirmIdentity()
  await pages.livenessInform.isOnPage()
  await steps.completeLivenessDev(uuid)

 
})
