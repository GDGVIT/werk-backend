const express = require('express')
const router = express.Router()
const controller = require('../controllers/chat')
const authMiddleware = require('../middlewares/auth')

router.get('/:id', authMiddleware, controller.oldMessages)

module.exports = router
