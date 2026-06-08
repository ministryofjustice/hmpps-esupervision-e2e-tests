import { expect, request } from "@playwright/test"
import process from "process"
import { getEsupervisionContext, getToken } from "./clientToken"

const E_SUPERVISION_API_URL = process.env.E_SUPERVISION_API_URL
const PRACTITIONER_NAME = process.env.PRACTITIONER_NAME

const apiUrl = (): string => {
  if (!process.env.E_SUPERVISION_API_URL) throw new Error('E_SUPERVISION_API_URL env var is not set')
  return process.env.E_SUPERVISION_API_URL
}

export const createEsupervisionCheckin = async( crn: string, date: string, token: string, allowFail: boolean = false) : Promise<string> => {
    const context = await request.newContext({
        baseURL: E_SUPERVISION_API_URL,
    });
    const response = await context.post(`/v2/offender_checkins/crn`, {
        headers: {
            'Authorization': 'Bearer ' + token
        },
        data: {
            "practitioner": PRACTITIONER_NAME,
            "offender": crn,
            "dueDate": date
        }
    })
    let body
    if (allowFail){
        try {
            body = await response.json()
        } catch {
            console.log('failed for CRN: ' + crn)
        }
    } else {
        body = await response.json()
    }
    return body.uuid
}
