const express = require('express')
const router = express.Router()
const controllers = require('../controllers/user')
const authMiddleware = require('../middlewares/auth')

router.post('/updateName', authMiddleware, controllers.updateName)

module.exports = router
