/**
 * @file Prometheus server that can be listened to. Exports only UPS data currently
 */
// Clone from https://github.com/DistroByte/AwF-Bot/blob/master/base/Prometheus.js

const promClient = require('prom-client')
const http = require('http')
const config = require("../../config")
const fetch = require("node-fetch")
const ConfigModel = require("../database/schemas/config")

const collectDefaultMetrics = promClient.collectDefaultMetrics;
const Registry = promClient.Registry;
const register = new Registry();
collectDefaultMetrics({ register });

const communityGauge = new promClient.Gauge({
    name: "community_trust_count",
    help: "Amount of communities that trust this community",
    labelNames: ['id', 'name', 'contact']
})
const ruleGauge = new promClient.Gauge({
    name: "rule_trust_count",
    help: "Amount of communities that trust this rule",
    labelNames: ['id', 'shortdesc']
})

register.registerMetric(communityGauge)
register.registerMetric(ruleGauge)

// Format community trust from config
const trustedCommunities = async (communities) => {
    let rawResults = []
    communities.forEach((community) => {
        community.trustedCommunities.forEach((communityID) => {
            let found = false
            rawResults.forEach((trusted) => {
                if (trusted.id === communityID) {
                    trusted.count++
                    found = true
                }
            })
            if (!found) {
                rawResults.push({ id: communityID, count: 1 })
            }
        })
    })
    let results = rawResults.map(async (community) => {
        return {
            community: await fetch(`${config.apiurl}/communities/getid?id=${community.id}`).then((r) => r.json()),
            count: community.count
        }
    })
    return await Promise.all(results)
}
// Format rule trust from config
const trustedRules = async (communities) => {
    let rawResults = []
    communities.forEach((community) => {
        community.ruleFilters.forEach((ruleID) => {
            let found = false
            rawResults.forEach((trusted) => {
                if (trusted.id === ruleID) {
                    trusted.count++
                    found = true
                }
            })
            if (!found) {
                rawResults.push({ id: ruleID, count: 1 })
            }
        })
    })
    let results = rawResults.map(async (rule) => {
        return {
            rule: await fetch(`${config.apiurl}/rules/getid?id=${rule.id}`).then((r) => r.json()),
            count: rule.count
        }
    })
    return await Promise.all(results)
}

// collect statistics and put them to the server
const collectStatistics = async () => {
    let communitySettings = await ConfigModel.find({})
        .then((configs) => configs.map((CommunityConfig) => CommunityConfig._doc))
        .then((configs) => configs.map((CommunityConfig) => { delete CommunityConfig.apikey; return CommunityConfig }))

    let rules = await trustedRules(communitySettings)
    let communities = await trustedCommunities(communitySettings)

    rules.forEach((rule) => {
        ruleGauge.set({ id: rule.rule._id, shortdesc: rule.rule.shortdesc }, rule.count)
    })
    communities.forEach((community) => {
        communityGauge.set({
            id: community.community._id,
            name: community.community.name,
            contact: community.community.contact
        }, community.count)
    })
}

setInterval(async () => {
    collectStatistics()
}, 3600 * 1000 * 3) // collect every 3 hours (3*3600*1000)
collectStatistics() // initial statistics collection



// Server for data collection
http.createServer(async (req, res) => {
    if (req.url.endsWith("/metrics")) {
        return res.end(await register.metrics())
    }
}).listen(9110)

module.exports = {
    promClient,
    register,
}
