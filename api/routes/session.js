const express = require('express')
const router = express.Router()
const controller = require('../controllers/session')
const authMiddleware = require('../middlewares/auth')

router.post('/create', authMiddleware, controller.createSession)

router.post('/join', authMiddleware, controller.joinSession)

router.get('/', authMiddleware, controller.getSessions)

router.get('/getParticipants/:id', authMiddleware, controller.getParticipants)

module.exports = router
