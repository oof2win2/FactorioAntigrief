const LogSchema = require("../database/fagc/log")

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
        var body = Buffer.concat(chunks).toString('utf8')
        LogSchema.create({
            timestamp: new Date(),
            api_key: req.headers.apikey,
            ip: req.get('host').slice(0, req.get('host').indexOf(":")),
            responseBody: JSON.parse(body),
            requestBody: req.body,
            endpointAddress: req.originalUrl
        })
        oldEnd.apply(res, arguments)
    };
    next();
}
module.exports = logResponse