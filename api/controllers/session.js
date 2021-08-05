
const { BadRequest, Unauthorized } = require('../utils/errors')
const { sendAccessCode } = require('../utils/email')
const crypto = require('crypto')
const User = require('../models/user')
const Session = require('../models/session')
const Participant = require('../models/participant')
const { generateQRCode } = require('../utils')
const { deleteFile } = require('../utils/s3Utils')
// const Task = require('../models/task')
require('dotenv').config()

exports.createSession = async (req, res) => {
  try {
    // start and end time are in epoch format
    const { startTime, endTime, taskCreationByAll, taskAssignByAll, participants, name, description } = req.body
    if (!name || !description || !startTime || !endTime || taskCreationByAll === null || taskAssignByAll === null || !participants.length) throw new BadRequest('All required fields are not provided')
    if (startTime >= endTime) throw new BadRequest('End Time cannot be less than or equal to the start time')
    if (startTime < new Date().getTime() || endTime < new Date().getTime()) throw new BadRequest('Choose only future time and date')

    // if (new Date().getTime() > startTime || new Date().getTime() > endTime) throw new BadRequest('Provided timings are not valid!')

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

    const data = await generateQRCode(accessCode)

    const session = await Session.create({
      sessionName: name,
      sessionDescription: description,
      startTime,
      endTime,
      createdBy: req.user.userId,
      taskCreationUniv: taskCreationByAll,
      taskAssignUniv: taskAssignByAll,
      accessCode,
      qrCode: data.Location
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
      if (i !== 0) await sendAccessCode(accessCode, p.email, req.user.name, data.Location, name, description)
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
      attributes: ['participantId', 'joined', 'userId'],
      where: {
        sId: session[0].sessionId
      }
    })

    const index = participant.findIndex(p => {
      return p.userId === req.user.userId
    })
    if (index === -1) throw new Unauthorized('You have not been invited to this session')
    if (participant[index].joined) throw new BadRequest('You have already joined this session')

    participant[index].joined = true
    await participant[index].save()
    // checking if all the participants joined
    let check = true
    participant.forEach(p => {
      if (p.joined === false) {
        check = false
      }
    })
    if (check === true) {
      await deleteFile(process.env.AWS_BUCKET, session[0].qrCode)
    }

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
    let sessions = await user.getSessions()
    sessions = sessions.filter(s => s.participant.joined === true)
    const data = []
    let participants = null
    for (const x in sessions) {
      sessions[x].createdBy = await sessions[x].getUser({
        attributes: ['userId', 'name', 'email', 'avatar']
      })
      delete sessions[x].dataValues.participant
      participants = await sessions[x].getUsers({
        attributes: ['userId', 'name', 'email', 'avatar']
      })
      participants = participants.filter(p => { return p.participant.joined === true })
      participants = participants.map(p => { return { name: p.name, email: p.email, avatar: p.avatar } })
      data.push({
        session: sessions[x],
        participants: participants.filter((p, i) => i <= 2),
        participantsCount: participants.length
      })
    }
    res.status(200).json({
      sessions: data
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
    let users = participants.map(p => {
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
    users = users.sort(function (a, b) { return b.points - a.points })

    const index = users.findIndex(u => u.userId === req.user.userId)

    if (index === -1) throw new Unauthorized('you are not a participant of this session')

    res.status(200).json({
      user: users[index],
      rank: index + 1,
      participants: users
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}
