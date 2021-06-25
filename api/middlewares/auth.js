const { Unauthorized } = require('../utils/errors')
const { verifyToken } = require('../utils')
const User = require('../models/user')

const authMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) throw new Unauthorized('Login Required!')

    const token = req.headers.authorization.replace('Bearer ', '')
    const user = verifyToken(token)
    const searchedUser = await User.findAll({
      attributes: {
        exclude: ['password']
      },
      where: {
        userId: user.userId
      }
    })
    if (!searchedUser.length) throw new Unauthorized('User is not registered!')
    if (!searchedUser[0].emailVerified) throw new Unauthorized('EMail is not verified!')

    req.user = searchedUser[0]
    next()
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

module.exports = authMiddleware
