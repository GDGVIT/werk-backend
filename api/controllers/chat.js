const GroupChat = require('../models/chat')
const Participant = require('../models/participant')
const User = require('../models/user')
const { BadRequest } = require('../utils/errors')
exports.oldMessages = async (req, res) => {
  try {
    const sId = req.params.id
    const user = await Participant.findAll({
      where: {
        userId: req.user.userId,
        sId,
        joined: true
      }
    })
    if (user.length === 0) throw new BadRequest('User is not in that session')

    const messages = await GroupChat.findAll({
      include: {
        model: User,
        attributes: {
          exclude: ['password', 'otp', 'otpExpiry', 'emailVerified']
        },
        as: 'sender'
      },
      where: {
        sentIn: sId
      }
    })

    const oldMessages = []

    for (let i = 0; i <= messages.length - 1; i++) {
      oldMessages.push({
        messageId: messages[i].messageId,
        message: messages[i].message,
        sentTime: messages[i].sentTime,
        sentBy: messages[i].sender,
        sender: messages[i].sentBy === req.user.userId
      })
    }
    // SENT TIME IS IN UTC TIME ZONE - EPOCH FORMAT
    res.status(200).send({
      oldMessages: oldMessages
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}
