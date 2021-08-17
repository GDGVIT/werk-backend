const transporter = require('../../config/email')
const crypto = require('crypto')
require('dotenv').config()

exports.sendVerificationLink = async (user) => {
  const accessCode = crypto.randomBytes(5).toString('hex')
  const link = `${process.env.TESTING ? process.env.LOCAL_URL : process.env.URL}/auth/verify/${accessCode}`
  const mailOptions = {
    from: process.env.WERK_EMAIL,
    to: user.email,
    subject: 'VERIFICATION MAIL',
    html: emailVerificationTemplate({ userName: user.name, link })
  }

  user.verificationCode = accessCode
  await user.save()

  return sendEmail(mailOptions)
}

exports.sendAccessCode = async (accessCode, email, sender, location, sessionName, sessionDesc, registered) => {
  const mailOptions = {
    from: process.env.WERK_EMAIL,
    to: email,
    subject: 'Invite to join a session of Werk',
    html: sendAccessCodeTemplate({ userName: sender, name: sessionName, desc: sessionDesc, code: accessCode, location, registered })
  }

  return sendEmail(mailOptions)
}

exports.passwordResetCode = async (code, email, user) => {
  user.otpExpiry = new Date().getTime() + 20 * 60 * 1000
  user.otp = code
  await user.save()
  const link = `${process.env.TESTING ? process.env.LOCAL_URL : process.env.URL}/auth/changePassword/${code}`
  const mailOptions = {
    from: process.env.WERK_EMAIL,
    to: email,
    subject: 'Reset the password of Werk Account',
    html: passwordRestCodeTemplate({ link, userName: user.name })
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
const emailVerificationTemplate = (data) => {
  return `<html>
  <body>
  <div style="text-align: center;">
    <a href="https://github.com/GDGVIT/werk-backend" ><img src="https://user-images.githubusercontent.com/30529572/92081025-fabe6f00-edb1-11ea-9169-4a8a61a5dd45.png" width="400" height="100"></a>
  </div>
  <div style="margin-left: 15px;">
      <p>Hola! <strong style="text-transform:capitalize;">${data.userName}</strong>, it's delightful to see you register at <em>Werk</em>.</p>
      <p>Please click <a style="text-decoration: none;" href="${data.link}">here</a> to verify your email</p>
      <br>
      <br>
      <br>
      <div>
      Thank you
      </div>
      <div>
        Werk Backend Team
      </div>
  </div>
  </body>
</html>`
}
const passwordRestCodeTemplate = (data) => {
  return `<html>
  <body>
  <div style="text-align: center;">
    <a href="https://github.com/GDGVIT/werk-backend" ><img src="https://user-images.githubusercontent.com/30529572/92081025-fabe6f00-edb1-11ea-9169-4a8a61a5dd45.png" width="400" height="100"></a>
  </div>
  <div style="margin-left: 15px;">
      <p>Hola! <strong style="text-transform:capitalize;">${data.userName}</strong>, you can reset the password by clicking on this link:  <a style="text-decoration: none;" href="${data.link}">Reset Password</a></p>
      <p>Do it quickly! This link is valid for 20 minutes only.</p>
      <br>
      <br>
      <br>
      <div>
      Thank you
      </div>
      <div>
        Werk Backend Team
      </div>
  </div>
  </body>
</html>`
}
const sendAccessCodeTemplate = (data) => {
  return `
  <html>
    <body>
    <div style="text-align: center;">
      <a href="https://github.com/GDGVIT/werk-backend" ><img src="https://user-images.githubusercontent.com/30529572/92081025-fabe6f00-edb1-11ea-9169-4a8a61a5dd45.png" width="400" height="100"></a>
    </div>
    <div style="margin-left: 15px;">
        ${data.registered === true
              ? ` <p>Hola! <strong style="text-transform:capitalize;">${data.userName}</strong> has invited you to the session <strong>${data.name}</strong>. ${data.desc.length > 0 ? 'The description of the session is "' + data.desc + '"' : ''}</p>`
              : ` <p>Hola! Werk is a productivity app. Your friend <strong style="text-transform:capitalize;">${data.userName}</strong> has invited to the session </p> <strong>${data.name}</strong> in the app. ${data.desc.length > 0 ? 'The description of the session is ' + data.desc + '.' : ''}`}
        <p>You can join the session by entering the access code: <strong>${data.code}</strong> in the Werk App. You can also join the session by scanning the given QRCode in the Werk app.</p>
        <div style="text-align:center"> <img  src="${data.location}" alt="img" width="200" height="200"/></div>
        <br>
        <br>
        <br>
      <div>
      Thank you
      </div>
      <div>
        Werk Backend Team
      </div>
    </div>
    </body>
  </html>`
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
