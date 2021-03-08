let express = require('express');
let router = express.Router();

/* GET home page. */
router.post('/', function (req, res) {
	// console.log(req.query)
	console.log(req.body, req.body.name)
	res.status(200).send("")
});
module.exports = router;
