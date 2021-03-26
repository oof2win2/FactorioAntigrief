const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const mongoose = require("mongoose")

// const logger = require('./utils/log')
const authUser = require("./utils/authUser")
const config = require("../config.json")

const ruleRouter = require('./routes/rules')
const communityRouter = require('./routes/communities')
const violationRouter = require('./routes/violations')
const informaticsRouter = require('./routes/informatics')
const revocationRouter = require('./routes/revocations')

const testingRouter = require('./routes/testing')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// app.set('trust proxy', true)
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// logger for any request other than POST
// app.use(logger);

// middleware for authentication
const authMiddleware = async (req, res, next) => {
    const authenticated = await authUser(req)
    if (authenticated === 404)
        return res.status(404).send("AuthenticationError: API key is wrong")
    if (authenticated === 401)
        return res.status(410).send("AuthenticationError: IP adress whitelist mismatch")
    next()
}
app.use('*', authMiddleware)

app.use('/rules', ruleRouter)
app.use('/communities', communityRouter)
app.use('/violations', violationRouter)
app.use('/revocations', revocationRouter)
app.use('/informatics', informaticsRouter)
app.use('/testing', testingRouter)

// catch 404 and forward to error handler
app.use(function (req, res) {
    res.status(404).send("Page Not Found")
});

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// app.use(expressModifyResponse(
//     (req, res) => {
//         return true
//     },
//     (req, res, body) => {
//         console.log(body.toString())
//         return body
//     }
// ))

mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

module.exports = app;
