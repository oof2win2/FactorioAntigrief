import * as Discord from 'discord.js'
import * as dotenv from 'dotenv'
import * as requests from './requests'
import { status, debug, info } from './utils/log'
import { getGuildConfig, loadGlobalConfig, saveGlobalConfig } from './utils/config'
import { sendReply, sendResult } from './utils/messages'
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
    'setPrefix     - Sets the prefix used to address this bot.',
    'setKey        - Sets the key to be used with the api, ask in our discord for info',
    'addRule       - Add a rule which your community follows',
    'removeRule    - Remove a rule which your community no longer follows',
    'rules         - List all rules which you follow',
    'allRules      - List all rules that are registered on the api',
    'addTrusted    - Add a trusted community to follow their actions',
    'removeTrusted - Remove a trusted community to stop following their actions',
    'trusted       - List all trusted communities',
    'communities   - List all communities using the api'
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

        case 'setprefix':
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            if (!args[0]) return sendReply(message, `❌ You must give a new prefix!`)
            if (args[1]) return sendReply(message, `❌ This command only accepts one argument!`)
            guildConfig.prefix = args[0]
            info(`Prefix set to ${args[0]} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ Prefix has been set to ${args[0]} by ${memberName}`)
            saveGlobalConfig()
            break

        case 'setkey':
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            if (process.env.self_host === 'true') return sendReply(message, `❌ Api key can only be changed with .env with self host enabled`)
            if (!args[0]) return sendReply(message, `❌ You must give a new key!`)
            if (args[1]) return sendReply(message, `❌ This command only accepts one argument!`)
            guildConfig.api_key = args[0]
            info(`Api key set to ${args[0]} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ Api key has been set to ${args[0]} by ${memberName}`)
            saveGlobalConfig()
            break
        // 
        // Rule Commands
        //
        case 'addrule': {
            const valid: number[] = []
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            if (!validNumbers(message, args, valid)) return
            valid.forEach(rule => { if (!guildConfig.rules.includes(rule)) guildConfig.rules.push(rule) })
            info(`Rules set to ${guildConfig.rules} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ ${valid.length} Rules have been added by ${memberName}`)
            saveGlobalConfig()
        }; break

        case 'removerule': {
            const valid: number[] = []
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            if (!validNumbers(message, args, valid)) return
            guildConfig.rules = guildConfig.rules.filter(v => !valid.includes(v))
            info(`Rules set to ${guildConfig.rules} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ ${valid.length} Rules have been removed by ${memberName}`)
            saveGlobalConfig()
        }; break

        case 'rules': 
            console.log(await requests.getRulesFiltered(guildConfig.rules))
            break

        case 'allrules':
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            console.log(await requests.getRules())
            break
        // 
        // Trusted Commands
        //
        case 'addtrusted': {
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            args.forEach(uid => { if (!guildConfig.trusted.includes(uid)) guildConfig.trusted.push(uid) })
            info(`Trusted set to ${guildConfig.trusted} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ ${args.length} Trusted have been added by ${memberName}`)
            saveGlobalConfig()
        }; break

        case 'removetrused': {
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            guildConfig.trusted = guildConfig.trusted.filter(uid => !args.includes(uid))
            info(`Trusted set to ${guildConfig.trusted} by ${message.member.displayName} in ${message.guild.name}`)
            sendResult(message, `✅ ${args.length} Trusted have been removed by ${memberName}`)
            saveGlobalConfig()
        }; break

        case 'trusted':
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            console.log(await requests.getCommunitiesFiltered(guildConfig.trusted))
            break

        case 'communities':
            if (!hasPermission(message, 'MANAGE_GUILD')) return
            console.log(await requests.getCommunities())
            break
        // 
        // Other Commands
        //
        case 'violations':
            console.log(await requests.getViolations())
            break

        case 'revocations':
            console.log(await requests.getRevocations())
            break

        default:
            sendReply(message, `❌ Command not recognized ${commandName}`)
    }
})

// Log the bot in
client.login(process.env.discord_api_key)