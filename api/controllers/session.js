
const { BadRequest, Unauthorized } = require('../utils/errors')
const { sendAccessCode } = require('../utils/email')
const crypto = require('crypto')
const User = require('../models/user')
const Session = require('../models/session')
const Participant = require('../models/participant')
// const Task = require('../models/task')
require('dotenv').config()

exports.createSession = async (req, res) => {
  try {
    // start and end time are in epoch format
    const { startTime, endTime, taskCreationByAll, taskAssignByAll, participants, name, description } = req.body
    if (!name || !description || !startTime || !endTime || !taskCreationByAll || !taskAssignByAll || !participants.length) throw new BadRequest('All required fields are not provided')
    const accessCode = crypto.randomBytes(5).toString('hex')

    const participantsFiltered = participants.filter(p => p !== req.user.email)

    if (!participantsFiltered.length) throw new BadRequest('Don\'t give your own email while creation of session')

    const result = await User.findAll({
      attributes: ['userId', 'email'],
      where: {
        email: participantsFiltered
      }
    })
    if (!result.length) throw new BadRequest('Provided emails are not registered with any of our user')

    const session = await Session.create({
      sessionName: name,
      sessionDescription: description,
      startTime,
      endTime,
      createdBy: req.user.userId,
      taskCreationUniv: taskCreationByAll,
      taskAssignUniv: taskAssignByAll,
      accessCode
    })

    result.splice(0, 0, req.user)
    const participantsArray = []
    result.forEach(async (p, i) => {
      participantsArray.push({
        sId: session.sessionId,
        userId: p.userId,
        joined: i === 0
      })
    })

    await Participant.bulkCreate(participantsArray)

    result.forEach(async (p, i) => {
      if (i !== 0) await sendAccessCode(accessCode, p.email, req.user.name)
    })

    res.status(200).json({
      session: { ...session.dataValues }
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.joinSession = async (req, res) => {
  try {
    const { accessCode } = req.body
    const session = await Session.findAll({
      where: {
        accessCode
      },
      include: {
        model: User,
        attributes: {
          exclude: ['password', 'otpExpiry', 'otp', 'emailVerified']
        }
      }
    })

    if (!session.length) throw new BadRequest('No session is associated with the given accessCode')

    const participant = await Participant.findAll({
      attributes: ['participantId', 'joined'],
      where: {
        userId: req.user.userId,
        sId: session[0].sessionId
      }
    })

    if (participant.length === 0) throw new Unauthorized('You have not been invited to this session')
    if (participant[0].joined) throw new BadRequest('You have already joined this session')

    participant[0].joined = true
    await participant[0].save()
    res.status(200).json({
      session: session[0]
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.getSessions = async (req, res) => {
  try {
    const user = req.user
    const sessions = await user.getSessions()
    const users = await User.findAll({
      where: {
        userId: sessions.map(s => s.createdBy)
      },
      attributes: ['userId', 'name', 'email', 'avatar']
    })
    const creators = {}
    users.forEach(u => {
      creators[u.userId] = u
    })
    const sessionWithUser = []
    for (let i = 0; i <= sessions.length - 1; i++) {
      if (sessions[i].participant.joined) {
        // sessions[i].createdBy = await sessions[i].getUser({ attributes: ['name', 'email', 'avatar'] })
        sessions[i].createdBy = creators[sessions[i].createdBy]
        delete sessions[i].dataValues.participant
        sessionWithUser.push(sessions[i])
      }
    }
    res.status(200).json({
      sessions: sessionWithUser
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.getParticipants = async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id)
    const participants = await session.getUsers()
    const users = participants.map(p => {
      return {
        userId: p.userId,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        joined: p.participant.joined,
        points: p.participant.points,
        sessionId: p.participant.sId
      }
    })
    if (users.findIndex(u => u.userId === req.user.userId) === -1) throw new Unauthorized('you are not a participant of this session')

    res.status(200).json({
      participants: users.sort(function (a, b) { return b.points - a.points })
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}
