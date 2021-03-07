export interface Rule {
    id: number,
    short: string,
    long: string
}

export interface Community {
    id: number,
    name: string,
    info?: string
}

export interface Violation {
    id: number,
    community_uid: number,
    playername: string,
    rule_id: number,
    time: Date,
    admin: string,
    automated: boolean,
    offenses: Array<Number>,
}

export interface Offense {
    id: number,
    playername: string,
    admin: string
    automated: boolean
}

export interface Revocation {
    id: number,
    violation: Violation,
    admin: string,
    time: Date
}