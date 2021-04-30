const express = require('express')
const router = express.Router()
const controllers = require('../controllers/task')
const authMiddleware = require('../middlewares/auth')

router.get("/",authMiddleware,controllers.getTasks)

router.post('/create',authMiddleware, controllers.createTask);

router.post('/:id/assign',authMiddleware,controllers.assignTask);

router.post('/:id/changeStatus',authMiddleware,controllers.changeStatus);

router.post('/:id/submit',authMiddleware,controllers.taskCompleted);

router.get('/assigned',authMiddleware,controllers.getTasksAssigned)

router.post('/:id/reassign',authMiddleware,controllers.taskShifted)

router.post('/:id/terminate',authMiddleware,controllers.taskTerminated)


module.exports= router






module.exports = router
