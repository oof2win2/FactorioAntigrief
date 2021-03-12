const LogSchema = require("../database/schemas/log")

// https://stackoverflow.com/questions/19215042/express-logging-response-body

function logResponse(req, res, next) {
    if (req.method === 'GET') return next()
    var oldWrite = res.write,
        oldEnd = res.end;
    var chunks = [];
    res.write = function (chunk) {
        chunks.push(chunk);
        return oldWrite.apply(res, arguments);
    };
    res.end = function (chunk) {
        if (chunk)
            chunks.push(chunk);
        var body = Buffer.concat(chunks).toString('utf8');
        // console.log(req.path, body);
        // console.log(req.body)
        // console.log(req.headers.apikey)
        LogSchema.create({
            timestamp: new Date(),
            apiKey: req.headers.apikey,
            ip: req.get('host').slice(0, req.get('host').indexOf(":")),
            responseBody: JSON.parse(body),
            requestBody: req.body
        })
        oldEnd.apply(res, arguments)
    };
    next();
}
module.exports = logResponse