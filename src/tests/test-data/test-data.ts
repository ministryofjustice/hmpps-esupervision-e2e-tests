import process from "process";

export const data = {
  data: {
    crn: process.env.TEST_CRN!,
    firstName: process.env.TEST_PERSON_FIRST_NAME!,
    lastName: process.env.TEST_PERSON_LAST_NAME!,
    dob: new Date(process.env.TEST_PERSON_DOB!),
  },
}