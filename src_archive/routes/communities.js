var express = require('express');
const app = require('../app');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.send("Main Page!");
});
router.get('/api', (req, res) => {
    res.send("API Page!");
})
router.get('/currentTime', (req, res) => {
    res.json({ "sentAtTime": `${new Date}`, "userFrom": "oof2win2" });
})

module.exports = router;