
const { BadRequest, Unauthorized } = require('../utils/errors')
// const { sendOTP } = require('../utils/email')
const { generateToken, hashIt, verifyHash, verifyAccessToken } = require('../utils')
const User = require('../models/user')
const validator = require('validator')
const { sendVerificationLink, passwordResetCode } = require('../utils/email')
require('dotenv').config()
const crypto = require('crypto')
// const path = require('path')

exports.googleAuth = async (req, res) => {
  try {
    const { accessToken } = req.body
    if (!accessToken) throw new BadRequest('ACCESS TOKEN NOT SPECIFIED')
    const user = await verifyAccessToken(accessToken)
    let searchedUser = await User.findOne({
      attributes: { exclude: ['password'] },
      where: {
        email: user.email
      }
    })
    if (!searchedUser) {
      const result = await User.create({
        name: user.displayName || '',
        email: user.email,
        avatar: user.photoURL || process.envv.DEFAULT_AVATAR,
        emailVerified: true
      })
      searchedUser = result
    }
    const token = generateToken({
      userId: searchedUser.userId
    })

    res.status(200).json({
      token,
      userDetails: {
        name: searchedUser.name,
        email: searchedUser.email,
        avatar: searchedUser.avatar,
        userId: searchedUser.userId
      }
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) throw new BadRequest('Required data not provided')

    const searchedUser = await User.findAll({
      attributes: { exclude: ['password'] },
      where: {
        email: email
      }
    })

    console.log(searchedUser)

    if (searchedUser.length) { throw new BadRequest('Email is already registered!') }

    const hashedPassword = await hashIt(password)

    if (!validator.isEmail(email)) throw new BadRequest('Email format is incorrect')

    if (password.length < 5) throw new BadRequest('Password must have more than 5 chars')

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    const token = generateToken({
      userId: user.userId
    })

    res.status(200).json({
      token,
      userDetails: {
        name,
        email,
        avatar: user.avatar,
        userId: user.userId
      }
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) throw new BadRequest('Required data is not provided')
    const searchedUser = await User.findAll({
      where: {
        email: email
      }
    })
    if (!searchedUser.length) throw new Unauthorized('Email is not registered with us!')

    if (!searchedUser[0].emailVerified) throw new Unauthorized('Email is not verified!')
    const check = await verifyHash(password, searchedUser[0].password)

    if (!check) throw new Unauthorized('Password is incorrect!')

    const token = generateToken({
      userId: searchedUser[0].userId
    })

    res.status(200).json({
      token,
      userDetails: {
        name: searchedUser[0].name,
        email,
        avatar: searchedUser[0].avatar,
        userId: searchedUser[0].id
      }
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.sendEmail = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) throw new BadRequest('Email is not provided!')

    const searchedUser = await User.findAll({
      attributes: {
        exclude: ['password']
      },
      where: {
        email: email
      }
    })
    if (!searchedUser.length) throw new BadRequest('Email is not registered with us!')
    if (searchedUser[0].emailVerified) throw new BadRequest('Email is already verified!')

    await sendVerificationLink(searchedUser[0])
    res.status(200).json({
      message: 'successfully sent the mail'
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.verifyEmail = async (req, res) => {
  try {
    const verificationCode = req.params.code
    const searchedUser = await User.findAll({
      attributes: {
        exclude: ['password']
      },
      where: {
        verificationCode
      }
    })
    if (!searchedUser.length) throw new BadRequest('Email is not registered with us!')
    if (searchedUser[0].emailVerified) throw new BadRequest('EMAIL IS ALREADY REGISTERED!')

    searchedUser[0].emailVerified = true
    await searchedUser[0].save()

    res.status(200).send('<h3 style="text-align:center"> EMAIL REGISTERED! </h3>')
  } catch (e) {
    console.log(e)
    // just send 404 page!
    res.status(e.status || 500).send(`<h2 style="text-align:center"> ${e.status ? e.message : 'INTERNAL SERVER ERROR'} </h2>`)
  }
}

exports.sendResetPasswordLink = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) throw new BadRequest('Email is not provided!')
    const searchedUser = await User.findAll({
      attributes: {
        exclude: ['password']
      },
      where: {
        email: email
      }
    })
    if (!searchedUser.length) throw new BadRequest('Email is not registered with us!')
    await passwordResetCode(crypto.randomBytes(5).toString('hex'), email, searchedUser[0])
    res.status(200).json({
      message: 'successfully sent the email'
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.changePasswordPage = async (req, res) => {
  try {
    const otp = req.params.otp
    console.log(otp)
    const searchedUser = await User.findAll({
      attributes: {
        exclude: ['password']
      },
      where: {
        otp
      }
    })
    if (!searchedUser.length) throw new BadRequest('INVALID CODE')

    const currentTime = new Date().getTime()

    if (searchedUser[0].otpExpiry < currentTime) throw new BadRequest('LINK EXPIRED')

    res.render('changePassword', { url: `${process.env.TESTING ? process.env.LOCAL_URL : process.env.URL}/auth/changePassword`, userId: searchedUser[0].userId })
    // res.status(200).sendFile(changePasswordPage({ url: `${process.env.TESTING ? process.env.LOCAL_URL : process.env.URL}/auth/changePassword`, userId: searchedUser[0].userId }))
  } catch (e) {
    console.log(e)
    res.status(404).send()
  }
}

exports.changePassword = async (req, res) => {
  try {
    const userId = Object.keys(req.body)[0]
    const password = Object.values(req.body)[0]
    const searchedUser = await User.findAll({
      attributes: {
        exclude: ['password']
      },
      where: {
        userId
      }
    })
    if (!searchedUser.length) throw new BadRequest('Invalid User')
    const hashedPassword = await hashIt(password)

    searchedUser[0].password = hashedPassword

    searchedUser[0].otpExpiry = new Date().getTime()

    await searchedUser[0].save()

    res.status(200).render('generalMessage', { message: 'Successfully changed the password!' })
  } catch (e) {
    console.log(e)
    // send some html response!
    res.status(400).send()
  }
}
