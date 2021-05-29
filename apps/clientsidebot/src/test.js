const { getStringFromID, getRegexFromString } = require("./utils/functions")

const idStr = "60a8012a027b1c2365f298ad"
const string = getStringFromID(idStr)

console.log(string)
const regex = getRegexFromString(string)
console.log(regex)