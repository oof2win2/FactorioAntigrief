
import * as Discord from 'discord.js'

export interface GlobalConfig {
    [guildId: string]: GuildConfig
}

export interface GuildConfig {
    prefix: string,
    api_key?: string,
    rules: number[],
    trusted: string[]
}