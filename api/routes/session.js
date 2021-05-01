const express = require('express')
const router = express.Router()
const controller = require('../controllers/session')
const authMiddleware = require('../middlewares/auth')



router.get('/', authMiddleware, controller.getSessions)

router.get('/:id/participants', authMiddleware, controller.getParticipants)

router.post('/create', authMiddleware, controller.createSession)

router.post('/join', authMiddleware, controller.joinSession)







module.exports = router
