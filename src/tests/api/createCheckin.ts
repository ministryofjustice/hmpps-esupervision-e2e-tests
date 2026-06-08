import { expect, request } from "@playwright/test"
import process from "process"
import { getEsupervisionContext, getToken } from "./clientToken"

const E_SUPERVISION_API_URL = process.env.E_SUPERVISION_API_URL

const apiUrl = (): string => {
  if (!process.env.E_SUPERVISION_API_URL) throw new Error('E_SUPERVISION_API_URL env var is not set')
  return process.env.E_SUPERVISION_API_URL
}

export const createEsupervisionCheckin = async( crn: string, date: string, token: string, allowFail: boolean = false) : Promise<string> => {
    const context = await request.newContext({
        baseURL: E_SUPERVISION_API_URL,
    });

    console.log(E_SUPERVISION_API_URL)
    const response = await context.post(`/v2/offender_checkins/crn`, {
        headers: {
            'Authorization': 'Bearer ' + token
        },
        data: {
            "practitioner": 'nithya.kannan',
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
    console.log(body)
    return body.uuid
}

export async function createOffenderCheckin(crn: string, dueDate: string): Promise<string> {
    const ctx = await getEsupervisionContext()

    const response = await ctx.post('/v2/offender_checkins/Y005803', {
        data: {
            practitioner: 'Nithya.Kannan',
            offender: crn,
            dueDate,
        },
    })

    expect(response.ok(), await response.text()).toBeTruthy()
    const { uuid } = await response.json()
    return uuid
}
