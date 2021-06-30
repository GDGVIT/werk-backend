const transporter = require('../../config/email')
const crypto = require('crypto')
require('dotenv').config()

exports.sendVerificationLink = async (user) => {
  const accessCode = crypto.randomBytes(5).toString('hex')

  const mailOptions = {
    from: process.env.WERK_EMAIL,
    to: user.email,
    subject: 'VERIFICATION MAIL',
    html: `<body>
        <p>Thank you for registering at WERK!</p>
      <p>Please click <a href="${process.env.TESTING ? process.env.LOCAL_URL : process.env.URL}/auth/verify/${accessCode}">here</a> to verify your email</p>
    </body>`
  }

  user.verificationCode = accessCode
  await user.save()

  return sendEmail(mailOptions)
}

exports.sendAccessCode = async (accessCode, email, sender, location) => {
  const mailOptions = {
    from: process.env.WERK_EMAIL,
    to: email,
    subject: 'Access code for the sessions',
    html: `<p>${sender.toUpperCase()} has invited you to join a session in werk app. </p>
          <p>Please use this accessCode: ${accessCode} for joining the session </p>
          <p>You can also scan the following qr code from our app, to join the session.</p>
          <img src="${location}" alt="img" width="200" height="200"/>`
  }

  return sendEmail(mailOptions)
}

exports.passwordResetCode = async (code, email, user) => {
  user.otpExpiry = new Date().getTime() + 20 * 60 * 1000
  user.otp = code
  await user.save()

  const mailOptions = {
    from: process.env.WERK_EMAIL,
    to: email,
    subject: 'Password Rest Code',
    html: `<p>You can reset the password by clicking on this link : <a href="${process.env.TESTING ? process.env.LOCAL_URL : process.env.URL}/auth/changePassword/${code}">RESET PASSWORD</a></p>
          <p> This link is valid only for 20 minutes!</p>`
  }

  return sendEmail(mailOptions)
}

const sendEmail = async (mailOptions) => {
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

// exports.sendVerificationLink = async (accessCode, email, sender) => {

//   const otp = otpGenerator.generate(6, {
//     upperCase: false,
//     specialChars: false
//   })

//   const validityTime = new Date().getTime() + 10 * 60 * 1000

//   const mailOptions = {
//     from: process.env.WERK_EMAIL,
//     to: user.email,
//     subject: 'OTP FOR VERIFICATION',
//     text: `Thank you for registering! Your otp is ${otp} and is valid only for ten minutes.`
//   }

//   user.otp = otp
//   user.otpExpiry = validityTime
//   await user.save()
//   const mailOptions = {
//     from: process.env.WERK_EMAIL,
//     to: email,
//     subject: 'Verfication Link',
//     text: `Click on this link to verify your email: ${process.env.TESTING ? process.env.LOCAL_URL : process.env.URL}/auth/verifyEmail/${accessCode}`
//   }

//   return new Promise((resolve, reject) => {
//     transporter.sendMail(mailOptions, function (error, info) {
//       if (error) {
//         reject(error)
//       } else {
//         resolve(info)
//       }
//     })
//   })
// }
