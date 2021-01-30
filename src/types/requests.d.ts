
export interface Rule {
    id: number,
    short: string,
    detailed: string
}

export interface Community {
    uid: string,
    name: string
}

export interface Violation {
    id: number,
    community_uid: string,
    playername: string,
    rule_id: number,
    time: string,
    admin: string,
    automated: boolean
}

export interface Revocation {
    id: number,
    violation: Violation,
    admin: string,
    time: string
}

export interface Offence {
    playername: string,
    rule_id: number,
    admin: string,
    automated?: boolean
}

export interface Filter {
    query: string,
    parameters: Array<string | number | string[] | number[]>
}