import { APIRequestContext, request } from "@playwright/test";
import { Buffer } from "buffer";
import process from "process";

const AUTH_URL = process.env.AUTH_URL


export async function getEsupervisionContext(): Promise<APIRequestContext> {
    const token = await getToken()
    return request.newContext({
        baseURL: process.env.ESUPERVISION_API,
        extraHTTPHeaders: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    })
}

export const getToken = async () => {
    const context = await request.newContext({
        baseURL: AUTH_URL,
    })

    console.log(AUTH_URL)
    const creds = Buffer.from(`${process.env.AUTH_CLIENT_ID}:${process.env.AUTH_CLIENT_SECRET}`).toString(
        'base64'
    )
    const response = await context.post(
        `/auth/oauth/token?grant_type=client_credentials`,
        {
            headers: {
                Accept: 'application/json',
                Authorization: `Basic ${creds}`,
            },
        }
    )
    const json = await response.json()
    return json.access_token
}
