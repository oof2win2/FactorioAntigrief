import * as Discord from 'discord.js'
import * as dotenv from 'dotenv'
import * as requests from './requests'
import { status, debug, info } from './utils/log'
import { getGuildConfig, loadGlobalConfig, saveGlobalConfig } from './utils/config'
import { sendLines, sendReply, sendResult } from './utils/messages'
import { Violation } from './types/requests'
dotenv.config()
loadGlobalConfig(process.env.config_path)

// Check if the member has permission
function hasPermission(message: Discord.Message, permission: Discord.PermissionString): boolean {
    if (!message.member.hasPermission(permission)) {
        sendReply(message, `❌ You do not have the permissions to that command!`)
        return false
    }
    return true
}

// Check if the member has a role
function hasRole(message: Discord.Message, role: string): boolean {
    if (!message.member.roles.cache.has(role)) {
        sendReply(message, `❌ You do not have the permissions to that command!`)
        return false
    }
    return true
}

// Test if all the strings can be converted to numbers
function validNumbers(message: Discord.Message, args: string[], valid: number[]): boolean {
    for (let i = 0; i < args.length; i++) {
        try { valid.push(Number(args[i])) }
        catch {
            sendReply(message, `❌ You must give number ids, ${args[i]} is not a number`)
            return false
        }
    }
    return true
}

// Setup the bot
const client = new Discord.Client()

// Add the ready message
client.once('ready', async () => {
    status('Bot Ready')
})

// Define the help message
const helpMessage = [
    'setPrefix     - Set the prefix used to address this bot.',
    'setApi        - Set the uid and key to be used with the api, ask in our discord for info',
    'setModRole    - Set the the id of the role which can access ban and unban commands',

    'addRule       - Add a rule which your community follows',
    'removeRule    - Remove a rule which your community no longer follows',
    'rules         - List all rules which you follow',
    'allRules      - List all rules that are registered on the api',

    'addTrusted    - Add a trusted community to follow their actions',
    'removeTrusted - Remove a trusted community to stop following their actions',
    'trusted       - List all trusted communities',
    'communities   - List all communities using the api',

    'banlist       - Generate a banlist file from your settings',
    'check         - Generate a record of all the violations from a player'
].join('\n')

// Add the command handlers
const TrueInput = ['true', 'on', 'enable', 'enabled', 'yes']
const FalseInput = ['false', 'off', 'disable', 'disabled', 'no']
client.on('message', async message => {
    if (process.env.NODE_ENV !== 'production' && message.guild.id !== process.env.dev_guild) return
    if (process.env.self_host === 'true' && message.guild.id !== process.env.guild_id) return

    const guildConfig = getGuildConfig(message.guild)
    if (!message.content.startsWith(guildConfig.prefix)) return
    message.delete()

    const args = message.content.slice(guildConfig.prefix.length)
        .match(/"([^"]+?)"|(\S+)/g)
        .map(arg => arg.startsWith('"') ? arg.slice(1,-1) : arg)

    const memberName = message.member.displayName
    const channel = message.channel as Discord.TextChannel
    const commandName = args.shift().toLowerCase()
    
    debug(`Received command "${commandName}" from ${message.member.displayName}`)
    switch (commandName) {
        // 
        // Util Commands
        //
        case 'ping':
            sendReply(message, 'Pong')
            break

        case 'help':
            if (args[0]) return sendReply(message, `❌ This command does not accept any arguments!`)
            message.reply('\n```css\n'+helpMessage+'```')
            break

        // Set the prefix that the bot will respond to
        case 'setprefix':
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            if (!args[0]) return sendReply(message, `❌ You must give a new prefix!`)
            if (args[1]) return sendReply(message, `❌ This command only accepts one argument!`)
            guildConfig.prefix = args[0]
            info(`Prefix set to ${args[0]} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ Prefix has been set to ${args[0]} by ${memberName}`)
            saveGlobalConfig()
            break

        // Set the role id of the moderator role (role which can ban, unban, and check violations)
        case 'setmodrole':
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            if (!args[0]) return sendReply(message, `❌ You must give a new role id!`)
            if (args[1]) return sendReply(message, `❌ This command only accepts one argument!`)
            guildConfig.mod_role = args[0]
            info(`Mod role set to ${args[0]} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ Mod role has been set to ${args[0]} by ${memberName}`)
            saveGlobalConfig()
            break

        // Set the api uid and key for your community, this will allow access to the api
        case 'setapi':
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            if (process.env.self_host === 'true') return sendReply(message, `❌ Api can only be changed with .env with self host enabled`)
            if (!args[0]) return sendReply(message, `❌ You must give a uid!`)
            if (!args[1]) return sendReply(message, `❌ You must give a key!`)
            if (args[2]) return sendReply(message, `❌ This command only accepts two argument!`)
            guildConfig.api_uid = args[0]
            guildConfig.api_key = args[1]
            guildConfig.trusted.push(args[0])
            info(`Api set to ${args[0]} ${args[1]} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ Api have been updated by ${memberName}`)
            saveGlobalConfig()
            break
        // 
        // Rule Commands
        //
        // Add a rule(s) to the rule list for ban list generation and webhooks
        case 'addrule': {
            const valid: number[] = []
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            if (!validNumbers(message, args, valid)) return
            valid.forEach(rule => { if (!guildConfig.rules.includes(rule)) guildConfig.rules.push(rule) })
            info(`Rules set to ${guildConfig.rules} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ ${valid.length} Rules have been added by ${memberName}`)
            saveGlobalConfig()
        }; break

        // Remove a rule(s) from the rule list so it will no longer be included in banlist generation of webhooks
        case 'removerule': {
            const valid: number[] = []
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            if (!validNumbers(message, args, valid)) return
            guildConfig.rules = guildConfig.rules.filter(v => !valid.includes(v))
            info(`Rules set to ${guildConfig.rules} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ ${valid.length} Rules have been removed by ${memberName}`)
            saveGlobalConfig()
        }; break

        // List all the rules currently in the rule list for a community
        case 'rules': {
            if (!hasRole(message, guildConfig.mod_role)) return
            const rules = await requests.getRulesFiltered(guildConfig.rules)
            const lines: string[] = ['```css\nRules for your community:```']
            rules.forEach((rule, index) => lines.push(`\`\`\`css\n${index+1}) ${rule.short}\`\`\`${rule.detailed} (Global ID: ${rule.id})\n`))
            sendLines(message, lines)
        }; break

        // List all the rules supported by the fagc api
        case 'allrules': {
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            const rules = await requests.getRules()
            const lines: string[] = ['```css\nAll rules supported by FAGC:```']
            rules.forEach(rule => lines.push(`${rule.id}) \`${rule.short}\` - ${rule.detailed}`))
            sendLines(message, lines)
        }; break
        // 
        // Community Commands
        //
        // Adds a community as a trusted one so it will be included in your banlist
        case 'addtrusted': {
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            args.forEach(uid => { if (!guildConfig.trusted.includes(uid)) guildConfig.trusted.push(uid) })
            info(`Trusted set to ${guildConfig.trusted} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ ${args.length} Trusted have been added by ${memberName}`)
            saveGlobalConfig()
        }; break

        // Removes a community as a trusted one so it will no longer be included in your banlist
        case 'removetrused': {
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            guildConfig.trusted = guildConfig.trusted.filter(uid => !args.includes(uid))
            info(`Trusted set to ${guildConfig.trusted} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ ${args.length} Trusted have been removed by ${memberName}`)
            saveGlobalConfig()
        }; break

        // List all trusted communities
        case 'trusted': {
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            const trusted = await requests.getCommunitiesFiltered(guildConfig.trusted)
            const lines: string[] = ['```css\nAll communities that you trust:```']
            trusted.forEach((community, index) => lines.push(`${index+1}) ${community.name} (${community.uid})`))
            sendLines(message, lines)
        }; break

        // List all communities registered on the api
        case 'communities':
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            const communities = await requests.getCommunities()
            const lines: string[] = ['```css\nAll communities registered with FAGC:```']
            communities.forEach((community, index) => lines.push(`${index+1}) ${community.name} (${community.uid})`))
            sendLines(message, lines)
            break
        // 
        // Moderator Commands
        //
        // Generates a ban list json file using the set config
        case 'banlist': {
            if (!hasRole(message, guildConfig.mod_role)) return
            if (guildConfig.rules.length === 0) return sendReply(message, `❌ Your community does not follow any global rules!`)
            const violations = await requests.getViolationsFiltered(guildConfig.rules, guildConfig.trusted)
            const players: Map<string, boolean> = new Map()
            const bans: Array<{ username: string, reason: string }> = []
            // Take each violation and add it to the ban list (once per player)
            violations.forEach(violation => {
                if (!players.has(violation.playername)) {
                    players.set(violation.playername, true)
                    bans.push({
                        username: violation.playername,
                        reason: `Banned by FAGC. Please see ${process.env.fagc_api_url}/violations/playername/${violation.playername}`
                    })
                }
            })

            channel.send(`✅ Banlist requested by ${memberName}`, new Discord.MessageAttachment(Buffer.from(JSON.stringify(bans)), 'banlist.json'))
        }; break

        // Check all violations for a player
        case 'check': {
            if (!hasRole(message, guildConfig.mod_role)) return
            if (!args[0]) return sendReply(message, `❌ You must give a player name!`)
            if (args[1]) return sendReply(message, `❌ This command only accepts one argument!`)
            const ruleData = await requests.getRules()
            const violations = await requests.getViolationsPlayer(args[0])
            const communities: Map<string, Violation[]> = new Map()
            const lines: string[] = [`\`\`\`css\nViolation record for ${args[0]}:\`\`\``]
            // Sort the violations by community
            violations.forEach(violation => {
                if (!communities.has(violation.community_uid)) {
                    communities.set(violation.community_uid, [ violation ])
                } else {
                    communities.get(violation.community_uid).push(violation)
                }
            })
            // List all the rules in a human readable way
            const communityData = await requests.getCommunitiesFiltered(Array.from(communities.keys()))
            communities.forEach((violations, uid) => {
                const brokenRules: string[] = []
                violations.forEach(violation => {
                    brokenRules.push(ruleData.find(r => r.id == violation.rule_id).short)
                })
                const date = new Date(violations[0].time).toDateString()
                lines.push(`${communityData.find(c => c.uid == uid).name}: (${date})\n  ` + brokenRules.join(', '))
            })

            sendLines(message, lines)
        }; break

        // Will be removed, debug only
        case 'violations':
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            console.log(await requests.getViolations())
            break

        // Will be removed, debug only
        case 'revocations':
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            console.log(await requests.getRevocations())
            break

        default:
            sendReply(message, `❌ Command not recognized ${commandName}`)
    }
})

// Log the bot in
client.login(process.env.discord_api_key)