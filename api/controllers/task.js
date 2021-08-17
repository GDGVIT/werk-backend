const User = require('../models/user')
const Session = require('../models/session')
const Participant = require('../models/participant')
const Task = require('../models/task')
const { BadRequest } = require('../utils/errors')
const { changeDurationFormat } = require('../utils')

// status = 'created' , 'assigned' , 'started' , 'paused' , 'terminated', 'completed'

exports.createTask = async (req, res) => {
  try {
    const { description, title, expectedDuration, points, sessionId } = req.body

    if (!description || !title || !expectedDuration || !points || !sessionId) { throw new BadRequest('All required fields are not provided') }

    const session = await Session.findOne({ where: { sessionId } })

    // if ((new Date().getTime() + (330 * 60 * 60) > session.endTime)) throw new BadRequest('Session is completed!')
    // if ((new Date().getTime() + (330 * 60 * 60) < session.startTime)) throw new BadRequest('Session has not started yet!')

    if (!session) throw new BadRequest('Session doesn\'t exist')

    if (!session.taskCreationUniv && req.user.userId !== session.createdBy) { throw new BadRequest('Task can be created only by the session owner') }

    const participant = await Participant.findOne({
      where: {
        sId: sessionId,
        userId: req.user.userId,
        joined: true
      }
    })

    if (!participant) { throw new BadRequest('You are not a participant of the session or You might have not joined it yet!') }
    const task = await Task.create({
      status: 'created',
      description,
      title,
      expectedDuration,
      points,
      givenIn: sessionId,
      createdBy: req.user.userId,
      createdDate: new Date().getTime()
    })

    res.status(201).json({
      task
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.assignTask = async (req, res) => {
  try {
    const taskId = req.params.id
    const { userId } = req.body

    if (!taskId || !userId) { throw new BadRequest('All required fields are not provided') }

    const task = await Task.findOne({ where: { taskId }, include: { model: Session } })
    if (!task) throw new BadRequest('task doesn\'t exist')

    if (task.assignedTo != null) throw new BadRequest('task is already assigned!')
    if (!task.session.taskAssignUniv && req.user.userId !== task.session.createdBy) { throw new BadRequest('Session creator can only assign the tasks') }

    const user = await User.findOne({ where: { userId } })
    if (!user) throw new BadRequest('Invalid User Id')
    const participant = await Participant.findOne({
      where: {
        sId: task.session.sessionId,
        userId,
        joined: true
      }
    })

    if (!participant) throw new BadRequest('Selected user is not a participant of the session or might have not joined it yet!')

    task.assignedTo = userId
    task.status = 'assigned'

    await task.save()

    res.status(200).json({
      task
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

/*
Status can be changed to either started or paused
In the req body, send 0: started and send 1: paused

*/

exports.changeStatus = async (req, res) => {
  try {
    const statusCodes = ['started', 'paused']
    const { statusCode } = req.body
    const taskId = req.params.id

    if (!(statusCode === 0 || statusCode === 1)) throw new BadRequest('Invalid Status Code')
    if (!taskId) throw new BadRequest('Task Id required')

    let task = await Task.findOne({ where: { taskId } })

    if (!task) throw new BadRequest('task doesn\'t exist')

    if (task.assignedTo !== req.user.userId) throw new BadRequest('This task is not assigned to you')

    if (task.status === statusCodes[statusCode]) throw new BadRequest('Task is already in ' + statusCodes[statusCode])

    if (task.status === 'completed' || task.status === 'terminated') throw new BadRequest('You cannot change the status of a ' + task.status + ' task')

    if (task.startedTime === -1 && statusCodes[statusCode] === 'paused') throw new BadRequest('Task did not start yet')

    if (statusCodes[statusCode] === 'started') task.startedTime = new Date().getTime()

    if (statusCodes[statusCode] === 'paused') {
      task.completionDuration += (new Date().getTime() - task.startedTime)
    }

    task.status = statusCodes[statusCode]
    await task.save()
    task = task.toJSON()
    res.status(201).json({
      ...task, ...changeDurationFormat(task.completionDuration)
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.taskCompleted = async (req, res) => {
  try {
    const taskId = req.params.id
    // const { completedDuration } = req.body

    if (!taskId) throw new BadRequest('Required details not provided')

    let task = await Task.findOne({ where: { taskId } })

    if (!task) throw new BadRequest('task doesn\'t exist')

    if (task.assignedTo !== req.user.userId) throw new BadRequest('This task is not assigned to you')

    if (task.submittedDate && task.status === 'completed') throw new BadRequest('This task is already completed!!')

    if (task.status === 'terminated') throw new BadRequest('You cannot change the status of a terminated task')

    if (task.status === 'started') task.completionDuration += (new Date().getTime() - task.startedTime)

    task.status = 'completed'
    // task.completionDuration = completedDuration
    task.submittedDate = new Date().getTime()

    await task.save()

    const participant = await Participant.findOne({
      where: {
        sId: task.givenIn,
        userId: task.assignedTo
      }
    })

    participant.points += task.points

    await participant.save()

    task = task.toJSON()
    res.status(200).json({
      ...task, ...changeDurationFormat(task.completionDuration)
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.taskTerminated = async (req, res) => {
  try {
    const taskId = req.params.id

    if (!taskId) throw new BadRequest('Required details not provided')

    let task = await Task.findOne({ where: { taskId } })

    if (!task) throw new BadRequest('task doesn\'t exist')
    if (task.assignedTo !== req.user.userId) throw new BadRequest('This task is not assigned to you')
    if (task.status === 'terminated') throw new BadRequest('Task is already terminated')
    if (task.status === 'completed') throw new BadRequest('Task is already completed')
    if (task.status === 'started') task.completionDuration += (new Date().getTime() - task.startedTime)
    task.status = 'terminated'

    await task.save()
    task = task.toJSON()
    res.status(200).json({
      ...task, ...changeDurationFormat(task.completionDuration)
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.taskShifted = async (req, res) => {
  try {
    const taskId = req.params.id
    const { userId } = req.body

    if (!taskId || !userId) { throw new BadRequest('All required fields are not provided') }

    const task = await Task.findOne({ where: { taskId }, include: { model: Session } })
    if (!task) throw new BadRequest('task doesn\'t exist')

    if (task.status === 'completed') { throw new BadRequest('Task is already completed!') }

    if (task.status === 'terminated') throw new BadRequest('task is already terminated')

    // ONLY TASK CREATOR AND SESSION CREATOR HAS THE POWER TO REASSIGN THE TASK TO SOMEONE ELSE!
    if (!task.session.taskAssignUniv && req.user.userId !== task.session.createdBy) throw new BadRequest('Tasks can be assigned only by the session creator!')
    // if (task.session.taskAssignUniv && req.user.userId !== task.createdBy && req.user.userId !== task.session.createdBy) { throw new BadRequest('Task creator and session creator can assign the task') }

    const user = await User.findOne({ where: { userId } })
    if (!user) throw BadRequest('Invalid User Id')

    const participant = await Participant.findOne({
      where: {
        sId: task.session.sessionId,
        userId,
        joined: true
      }
    })
    if (!participant) throw new BadRequest('Selected user is not a participant of the session or might have not joined it yet!')

    task.assignedTo = userId
    task.status = 'assigned'
    task.completionDuration = 0
    task.startedTime = -1

    await task.save()

    res.status(200).json({
      task
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.getTasks = async (req, res) => {
  try {
    const sessionId = req.params.id

    if (!sessionId) { throw new BadRequest('Session Not provided') }

    const session = await Session.findOne({ where: { sessionId } })
    if (!session) throw new BadRequest('Session doesn\'t exist')

    const participant = await Participant.findOne({
      where: {
        sId: sessionId,
        userId: req.user.userId,
        joined: true
      }
    })

    if (!participant) { throw new BadRequest('You are not a participant of the session or You might have not joined it yet!') }

    const tasks = await Task.findAll({
      where: {
        givenIn: sessionId
      },
      include: [
        {
          model: User,
          as: 'assigned',
          attributes: { exclude: ['password', 'otp', 'otpExpiry', 'emailVerified'] }
        },
        {
          model: User,
          as: 'creator',
          attributes: { exclude: ['password', 'otp', 'otpExpiry', 'emailVerified'] }
        }
      ]
    })
    for (const x in tasks) {
      tasks[x] = tasks[x].toJSON()
      if (tasks[x].status === 'started') tasks[x].completionDuration += (new Date().getTime() - tasks[x].startedTime)
      tasks[x] = { ...tasks[x], ...changeDurationFormat(tasks[x].completionDuration) }
    }
    // for (let i = 0; i <= tasks.length - 1; i++) {
    //   tasks[i].assignedTo = await tasks[i].getUser({ attributes: { exclude: ['password', 'otp', 'otpExpiry', 'emailVerified'] } })
    //   tasks[i].createdBy = await User.findOne({ where: { userId: tasks[i].createdBy }, attributes: { exclude: ['password', 'otp', 'otpExpiry', 'emailVerified'] } })
    // }

    res.status(200).json({
      tasks
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.getTasksAssigned = async (req, res) => {
  try {
    const sessionId = req.params.id
    if (!sessionId) { throw new BadRequest('Session Not provided') }
    const session = await Session.findOne({ where: { sessionId } })
    if (!session) throw new BadRequest('Session doesn\'t exist')

    const participant = await Participant.findOne({
      where: {
        sId: sessionId,
        userId: req.user.userId,
        joined: true
      }
    })

    if (!participant) { throw new BadRequest('You are not a participant of the session or You might have not joined it yet!') }
    const tasks = await Task.findAll({
      where: {
        givenIn: sessionId,
        assignedTo: req.user.userId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: { exclude: ['password', 'otp', 'otpExpiry', 'emailVerified'] }
        }
      ]
    })

    // for (let i = 0; i <= tasks.length - 1; i++) {
    //   tasks[i].assignedTo = await tasks[i].getUser({ attributes: { exclude: ['password', 'otp', 'otpExpiry', 'emailVerified'] } })
    //   tasks[i].createdBy = await User.findOne({ where: { userId: tasks[i].createdBy }, attributes: { exclude: ['password', 'otp', 'otpExpiry', 'emailVerified'] } })
    // }

    for (const x in tasks) {
      tasks[x] = tasks[x].toJSON()
      if (tasks[x].status === 'started') tasks[x].completionDuration += (new Date().getTime() - tasks[x].startedTime)
      tasks[x] = { ...tasks[x], ...changeDurationFormat(tasks[x].completionDuration) }
    }

    res.status(200).json({
      tasks
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.getTask = async (req, res) => {
  try {
    const taskId = req.params.id

    if (!taskId) throw new BadRequest('Required details not provided')

    let task = await Task.findOne({ where: { taskId } })

    if (!task) throw new BadRequest('task doesn\'t exist')
    // if (task.assignedTo && task.assignedTo !== req.user.userId) throw new BadRequest('This task is not assigned to you')
    task = task.toJSON()
    if (task.status === 'started') task.completionDuration += (new Date().getTime() - task.startedTime)
    res.status(200).json({ ...task, ...changeDurationFormat(task.completionDuration) })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}
