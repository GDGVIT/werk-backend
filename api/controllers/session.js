const pool = require('../../config/db')
const { BadRequest } = require('../utils/errors')
const { sendAccessCode } = require('../utils/email')
const { getOne, getConn, updateOne, insertOne } = require('../../db')
const crypto = require('crypto')
const User = require('../models/user')
const Session = require("../models/session")
const Participant = require("../models/participant")
const sequelize = require('../../config/db')
require('dotenv').config()

exports.createSession = async (req, res) => {
    try {
      // start time and end time format === YYYY-MM-DD HH:MM:SS
      const { startTime, endTime, taskCreationByAll, taskAssignByAll, participants } = req.body
      if (!startTime || !endTime || !taskCreationByAll || !taskAssignByAll || !participants.length) throw new BadRequest('All required fields are not provided')
      const accessCode = crypto.randomBytes(5).toString('hex')
      // const result = await getOne(connection, {
      //   tables: 'users',
      //   fields: 'userId,email',
      //   conditions: 'email in (?)',
      //   values: [participants]

      // })
      const result = await User.findAll({
        attributes:['userId','email'],
        where:{
          email:participants
        }
      })

      console.log("result",result)

      if (!result.length) throw new BadRequest('Provided emails are not registered with any of our user')

      // const data = {
      //   startTime,
      //   endTime,
      //   createdBy: req.user.userId,
      //   assignByAll: taskAssignByAll,
      //   taskByAll: taskCreationByAll,
      //   accessCode
      // }
      // const session = await insertOne(connection, {
      //   tables: 'sessions',
      //   data
      // })

      const session = await Session.create({
        startTime,
        endTime,
        createdBy:req.user.userId,
        taskCreationUniv:taskCreationByAll,
        taskAssignUniv:taskAssignByAll,
        accessCode
      })

      result.splice(0, 0, req.user)

      console.log("new result",result)

      result.forEach(async (p, i) => {
        // await insertOne(connection, {
        //   tables: 'participants',
        //   data: {
        //     s_id: session.insertId,
        //     userId: p.userId,
        //     joined: i === 0 ? 1 : 0
        //   }
        // })
        await Participant.create({
          sId:session.sessionId,
          userId:p.userId,
          joined: i === 0 ? true:false
        })
        if (i !== 0) await sendAccessCode(accessCode, p.email, req.user.name)
      })

      res.status(200).json({
        session: {...session.dataValues}
      })
  } catch (e) {
    console.log(e)
    if (e.status) {
      res.status(e.status).json({
        error: e.message
      })
    } else {
      res.status(500).json({
        error: e.toString()
      })
    }
  }
}

exports.joinSession = async (req, res) => {
    try {
      // start time and end time format === YYYY-MM-DD HH:MM:SS
      const { accessCode } = req.body
      // const session = await getOne(connection, {
      //   tables: '(select * from sessions where accessCode=?) as userSessions inner join users',
      //   fields: 's_id,startTime,endTime,createdBy,users.name as creator_name, users.email as creator_email ',
      //   conditions: 'userSessions.createdBy=users.userId',
      //   values: [accessCode]
      // })

      const session = await Session.findAll({
        where:{
          accessCode
        },
        // include:'createdBy'
      })



      
      if (!session.length) throw new BadRequest('No session is associated with the given accessCode')

      // const participant = await getOne(connection, {
      //   tables: 'participants',
      //   fields: 'id,joined',
      //   conditions: 'userId=? and s_id=?',
      //   values: [req.user.userId, session[0].s_id]
      // })

      const participant = await Participant.findAll({
        attributes:['participantId','joined'],
        where:{
          userId:req.user.userId,
          sId:session[0].sessionId
        }
      })

      if (participant.length === 0) throw new BadRequest('You have not been invited to this session')
      if (participant[0].joined) throw new BadRequest('You have already joined this session')
      // await updateOne(connection, {
      //   tables: 'participants',
      //   fields: 'joined=?',
      //   conditions: 'id=?',
      //   values: [1, participant[0].id]
      // })
      participant[0].joined = true;
      await participant[0].save();
      res.status(200).json({
        session: session[0]
      })
  } catch (e) {
    console.log(e)
    if (e.status) {
      res.status(e.status).json({
        error: e.message
      })
    } else {
      res.status(500).json({
        error: e.toString()
      })
    }
  }
}

exports.getSessions = async (req, res) => {
    try {
      // const sessions = await getOne(connection, {
      //   tables: `(select s_id,startTime,endTime,accessCode,createdAt,noOfParticipantsJoined,createdBy 
      //               from (select s_id,count(id) as noOfParticipantsJoined from participants 
      //               where s_id in (select s_id from participants where userId=? and joined=1 ) and participants.joined=1 group by s_id) as p
      //                natural join sessions) as userSessions inner join users`,
      //   fields: 'userSessions.*,users.name as creator_name,users.email as creator_email ',
      //   conditions: 'userSessions.createdBy=users.userId',
      //   values: [req.user.userId]
      // })
      const sessions = await Session.findAll({
        where:{
            createdBy:req.user.userId
        }
      })

      // const participantNo = await Participant.findAll({
      //   // attributes:['participantId'[sequelize.fn('count',sequelize.col('participantId'),'noOfParticipants')]],
      //   // group:['sId'],
      //   // raw:true,
      //   where:{
      //     sId:sessions.map(s=>s.sessionId)
      //   }
      // })


      // sessions = sessions.map(s,i=>{return {...s,noOfParticipants:participantNo[i]}});

      res.status(200).json({
        sessions: [...sessions]
      })
  } catch (e) {
    console.log(e)
    if (e.status) {
      res.status(e.status).json({
        error: e.message
      })
    } else {
      res.status(500).json({
        error: e.toString()
      })
    }
  }
}

exports.getParticipants = async (req, res) => {
    try {
      const sId = req.params.id
      // const users = await getOne(connection, {
      //   tables: '(select * from participants where s_id=?) as p natural join users order by points desc',
      //   fields: 'userId,name,email,points,joined',
      //   conditions: '',
      //   values: [sId]
      // })

      const participants = await Participant.findAll({
            where:{
              sId
            }
            // include:[{
            //   model:User,
            //   attributes:{
            //     exclude:['password','emailVerified','otp','otpExpiry']
            //   }
            // }]
      })
      //console.log("participants: ",participants)
      const users = [];
      for(let i=0;i<=participants.length-1;i++){
        const user = await User.findAll({
          where:{
            userId:participants[i].userId
          },
          attributes:{
            exclude:['password','otp','otpExpiry']
          }
        })
        users.push({
          participantId:participants[i].participantId,
          sessionId:participants[i].sId,
          points:participants[i].points,
          joined:participants[i].joined,
          user:user[0].dataValues
        })
      }
      console.log(users,"******************")
      if (users.findIndex(u => u.user.userId === req.user.userId) === -1) throw new BadRequest('you are not a participant of this session')

      res.status(200).json({
        participants: [...users]
      })
  } catch (e) {
    console.log(e)
    if (e.status) {
      res.status(e.status).json({
        error: e.message
      })
    } else {
      res.status(500).json({
        error: e.toString()
      })
    }
  }
}
