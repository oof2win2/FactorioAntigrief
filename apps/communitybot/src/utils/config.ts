import * as Discord from 'discord.js'
import * as fs from 'fs-extra'
import { GlobalConfig } from '../types/config'
let globalConfig: GlobalConfig
let configPath: string

// Load the global config
export function loadGlobalConfig(path: string) {
    try {
        configPath = path
        globalConfig = fs.readJSONSync(path)
    } catch (err) {
        if (err.code === 'ENOENT') {
            globalConfig = {}
            fs.writeJSONSync(path, globalConfig)
        } else {
            throw err
        }
    }
}

// Save the global config
export function saveGlobalConfig() {
    fs.writeJSONSync(configPath, globalConfig)
}

// Get the global config
export function getGlobalConfig() {
    return globalConfig
}

// Get the config for a guild
export function getGuildConfig(guild: Discord.Guild) {
    if (!(guild.id in globalConfig)) {
        globalConfig[guild.id] = {
            prefix: process.env.default_prefix,
            mod_role: guild.roles.highest.id,
            rules: [],
            trusted: []
        }

        if (process.env.self_host === 'true' && process.env.guild_id === guild.id) {
            const config = globalConfig[guild.id]
            config.api_key = process.env.fagc_key
            config.api_uid = process.env.fagc_uid
            config.trusted.push(process.env.fagc_uid)
        }
    }

    return globalConfig[guild.id]
}