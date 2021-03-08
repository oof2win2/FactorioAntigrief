const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const mongoose = require("mongoose")
const config = require("../config.json")

const authUser = require('./utils/authUser')

const indexRouter = require('./routes/index')
const communityRouter = require('./routes/communities')
const ruleRouter = require('./routes/rules')
const offenseRouter = require('./routes/offenses')
const violationsRouter = require('./routes/violations')

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

// middleware for authentication
const authMiddleware = async (req, res, next) => {
    const authenticated = await authUser(req)
    console.log("auth code", authenticated)
    if (authenticated === 404)
        return res.status(404).send("AuthenticationError: API key is wrong")
    if (authenticated === 401)
        return res.status(410).send("AuthenticationError: IP adress whitelist mismatch")
    next()
}

app.post('*', authMiddleware)
app.put('*', authMiddleware)

app.use('/index', indexRouter)
app.use('/communities', communityRouter)
app.use('/rules', ruleRouter)
app.use('/offenses', offenseRouter)
app.use('/violations', violationsRouter)

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

mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })

module.exports = app;
