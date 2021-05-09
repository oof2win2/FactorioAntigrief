// let data = [
//     { trusted: ["alpha", "beta", "charlie"] },
//     { trusted: ["beta", "charlie"] },
//     { trusted: ["charlie"] }
// ]
// let results = []
// data.forEach((community) => {
//     community.trusted.forEach((communityName) => {
//         let found = false
//         results.forEach((trusted) => {
//             if (trusted.name === communityName) {
//                 trusted.count++
//                 found = true
//             }
//         })
//         if (!found) {
//             results.push({name: communityName, count: 1})
//         }
//     })
// })
// console.log(results)

const configs = async () => {
    return [
        {
            trustedCommunities: [],
            ruleFilters: [],
            _id: "60978843c7b6a373201b84a0",
            communityname: "oof2win2's spam/dev",
            guildid: '749943992719769613',
            contact: 'oof2win2#3149 (test guild)',
            moderatorroleId: '777986482962432060',
            __v: 0,
            apikey: 'potato'
        }
    ]
}

let a = configs().then((configs) => configs.map((CommunityConfig) => { delete CommunityConfig.apikey; return CommunityConfig}))
a.then(console.log)