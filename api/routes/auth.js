const express = require('express')
const router = express.Router()
const controllers = require('../controllers/auth')

router.post('/google', controllers.googleAuth)

router.post('/register', controllers.register)

router.post('/login', controllers.login)

router.post('/sendOtp', controllers.sendEmail)

router.post('/verifyOtp', controllers.verifyEmail)

module.exports = router
