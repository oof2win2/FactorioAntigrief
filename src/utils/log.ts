import Chalk from 'chalk';
import moment from 'moment';

export const consoleColours = {
    error: Chalk.red,
    warn: Chalk.yellow,
    status: Chalk.yellowBright,
    info: Chalk.cyan,
    debug: Chalk.magentaBright,

    start: Chalk.green,
    stop: Chalk.red,
}

export function log(type: string, message: string, stringReplace: object = {}): void {
    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss')
    const logTypeLower = type.toLowerCase()
    const logTypeUpper = type.charAt(0).toUpperCase()+type.toLowerCase().slice(1)

    if (process.env.NODE_ENV === 'production' && logTypeLower === 'debug') return
    message = message.replace(/<.+>/g, match => {
        return Chalk.italic.blue(match)
    })

    for (let replaceKey in stringReplace) {
        message = message.replace(`{${replaceKey}}`, stringReplace[replaceKey])
    }

    if (consoleColours.hasOwnProperty(logTypeLower)) {
        const logTypeFormat = consoleColours[logTypeLower](`[${logTypeUpper}]`)
        console.log(Chalk`{grey ${dateTime}} ${logTypeFormat} ${message}`)
    } else {
        console.log(Chalk`{grey ${dateTime}} [${logTypeUpper}] ${message}`)
    }
}

export function error(message: string, stringReplace: object = {}): void {
    log('error', message, stringReplace)
}

export function warn(message: string, stringReplace: object = {}): void {
    log('warn', message, stringReplace)
}

export function status(message: string, stringReplace: object = {}): void {
    log('status', message, stringReplace)
}

export function info(message: string, stringReplace: object = {}): void {
    log('info', message, stringReplace)
}

export function debug(message: string, stringReplace: object = {}): void {
    log('debug', message, stringReplace)
}