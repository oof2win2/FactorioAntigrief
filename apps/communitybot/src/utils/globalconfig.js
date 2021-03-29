const fs = require('fs')
// const a = require("./config/defaultGlobalConfig.json")

class globalConfig {
    constructor() {
        this.config = {}
        this.loadGlobalConfig()
    }
    loadGlobalConfig = () => {
        if (fs.existsSync('./config/globalConfig.json'))
            this.config = require('../config/globalConfig.json')
        else 
            this.config = require("../config/defaultGlobalConfig.json")
    }
    saveGlobalConfig = () => {
        fs.writeFileSync('./config/globalConfig.json', JSON.stringify(this.config))
        console.log("saving config")
    }
}

let config = new globalConfig()
module.exports = config