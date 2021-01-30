import fetch, { RequestInit } from 'node-fetch'
import { Rule, Community, Violation, Revocation } from './types/requests'

async function request(url: string, options: RequestInit) {
    console.log(process.env.fagc_api_url + url)
    console.log(options)
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

export function getCommunitiesFiltered(uids: string[]): Promise<Community[]> {
    const params = new URLSearchParams()
    params.append('mode', 'include')
    uids.forEach(uid => params.append('uid', uid))
    return request('/communities?' + params.toString(), {
        method: 'GET'
    })
}

export function getViolations(): Promise<Violation[]> {
    return request('/violations', {
        method: 'POST'
    })
}

export function getViolationsPlayer(playername: string): Promise<Violation[]> {
    return request('/violations/playername/'+playername, {
        method: 'POST'
    })
}

export function getViolationsFiltered(rules: number[], trusted: string[]): Promise<Violation[]> {
    return request('/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: 'rule_id includes ? and community_uid includes ?',
            parameters: [ rules, trusted ]
        })
    })
}


export function getRevocations(): Promise<Revocation[]> {
    return request('/revocations', {
        method: 'POST'
    })
}