const transporter = require('../../config/email')
const otpGenerator = require('otp-generator')
// const User = require('../models/user')
require('dotenv').config()

exports.sendOTP = async (user) => {
  const otp = otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false
  })

  const validityTime = new Date().getTime() + 10 * 60 * 1000

  const mailOptions = {
    from: process.env.WERK_EMAIL,
    to: user.email,
    subject: 'OTP FOR VERIFICATION',
    text: `Thank you for registering! Your otp is ${otp} and is valid only for ten minutes.`
  }

  user.otp = otp;
  user.otpExpiry = validityTime;
  await user.save();

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        reject(error)
      } else {
        resolve(info)
      }
    })
  })
}

exports.sendAccessCode = async (accessCode, email, sender) => {
  const mailOptions = {
    from: process.env.WERK_EMAIL,
    to: email,
    subject: 'Access code for the sessions',
    text: `User ${sender} has invited you to join a session. Please provide this accessCode: ${accessCode} for joining the session`
  }

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        reject(error)
      } else {
        resolve(info)
      }
    })
  })
}
