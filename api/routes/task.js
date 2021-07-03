const express = require('express')
const router = express.Router()
const controllers = require('../controllers/task')
const authMiddleware = require('../middlewares/auth')

router.get('/session/:id', authMiddleware, controllers.getTasks)

router.get('/assigned/:id', authMiddleware, controllers.getTasksAssigned)

router.post('/create', authMiddleware, controllers.createTask)

router.post('/:id/assign', authMiddleware, controllers.assignTask)

router.post('/:id/changeStatus', authMiddleware, controllers.changeStatus)

router.post('/:id/submit', authMiddleware, controllers.taskCompleted)

router.post('/:id/reassign', authMiddleware, controllers.taskShifted)

router.post('/:id/terminate', authMiddleware, controllers.taskTerminated)

module.exports = router
