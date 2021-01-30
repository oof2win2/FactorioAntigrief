import fetch, { RequestInit } from 'node-fetch'
import { Rule, Community } from './types/requests'

async function request(url: string, options: RequestInit) {
    console.log(process.env.fagc_api_url + url)
    const res = await fetch(process.env.fagc_api_url + url, options)
    return await res.json()
}

export function getRules(): Promise<Rule[]> {
    return request('/rules', {
        method: 'GET'
    })
}

export function getRulesFiltered(ruleIds: number[]): Promise<Rule[]> {
    const params = new URLSearchParams()
    params.append('mode', 'include')
    ruleIds.forEach(rule => params.append('id', String(rule)))
    return request('/rules?' + params.toString(), {
        method: 'GET'
    })
}

export function getCommunities(): Promise<Community[]> {
    return request('/communities', {
        method: 'GET'
    })
}

export function getViolations(): Promise<Community[]> {
    return request('/violations', {
        method: 'POST'
    })
}

export function getRevocations(): Promise<Community[]> {
    return request('/revocations', {
        method: 'POST'
    })
}