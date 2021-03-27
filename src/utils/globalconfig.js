const fs = require('fs')
// const a = require("./config/defaultGlobalConfig.json")

class globalConfig {
    constructor() {
        this.config = {}
        this.loadGlobalConfig()
    }
    loadGlobalConfig = () => {
        // console.log(fs.readFileSync('./config/globalConfig.json', { encoding: "utf-8" }))
        if (fs.existsSync('./config/globalConfig.json'))
            this.config = require('../config/globalConfig.json')
        // else 
        //     this.config = require("../config/defaultGlobalConfig.json")
        // console.log(this.config)
    }
    saveGlobalConfig = () => {
        fs.writeFileSync('./config/globalConfig.json', JSON.stringify(this.config))
        console.log("saving config")
        console.log(fs.readFileSync('./config/globalConfig.json', { encoding: "utf-8" }))
    }
}

// let globalConfig
// const loadGlobalConfig = () => {
//     if (fs.existsSync('../config/globalConfig.json'))
//         globalConfig = require('../config/globalConfig.json')
//     else globalConfig = require("../config/defaultGlobalConfig.json")
//     return globalConfig
// }
// const saveGlobalConfig = () => {
//     fs.writeFileSync('./config/globalConfig.json', JSON.stringify(globalConfig))
//     console.log("saving config")
//     console.log(fs.readFileSync('./config/globalConfig.json', {encoding: "utf-8"}))
// }
// globalConfig = loadGlobalConfig()
// console.log({globalConfig})
let config = new globalConfig()
module.exports = config