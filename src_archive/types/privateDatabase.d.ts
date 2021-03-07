import express from "express"

export interface Log {
    timestamp: Date,
    request: express.Request,
    response: express.Response,
    community_uid: number,
    incomingIP: string
}

export interface ApiKey {
    key: string,
    community_uid: number,
    validFrom: Date,
    validTo?: Date,
}