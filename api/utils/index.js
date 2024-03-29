const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const qrcode = require('qrcode')
const path = require('path')
const fs = require('fs')
require('dotenv').config()
const admin = require('../../config/firebase')
const { uploadFile } = require('./s3Utils')

exports.generateToken = (user) => {
  const token = jwt.sign({ ...user }, process.env.JWT_SECRET)
  return token
}

exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

exports.hashIt = (password) => {
  return bcrypt.hash(password, 10)
}

exports.verifyHash = (password, hash) => {
  return bcrypt.compare(password, hash)
}

exports.verifyAccessToken = (token) => {
  return new Promise((resolve, reject) => {
    admin
      .auth()
      .verifyIdToken(token)
      .then((decodedToken) => {
        const uid = decodedToken.uid
        admin
          .auth()
          .getUser(uid)
          .then((userRecord) => {
            resolve(userRecord)
          })
          .catch((error) => {
            reject(error)
          })
      })
      .catch((error) => {
        reject(error)
      })
  })
}

exports.generateQRCode = async (data) => {
  const pathToFile = path.join(__dirname, '..', 'uploads', String(new Date().getTime()) + data + '.png')
  await qrcode.toFile(pathToFile, data)
  const buffer = fs.readFileSync(pathToFile)

  const awsResponse = await uploadFile('WERK/' + new Date().getTime() + data + '.png', buffer, process.env.AWS_BUCKET)
  fs.unlinkSync(pathToFile)
  return awsResponse
}

exports.changeDurationFormat = (time) => {
  let secs
  // let hours, mins
  if (time === 0 || time === null) {
    secs = 0
    // hours = mins = 0
  } else {
    time = Math.round(time / 1000)
    // hours = Math.floor(time / 3600)
    // time = time - hours * 3600
    // mins = Math.floor(time / 60)
    // time = time - mins * 60
    secs = time
  }

  return { elapsedSecs: secs }
}
