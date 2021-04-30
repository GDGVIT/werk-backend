const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
require('dotenv').config()
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.CLIENT_ID)
const admin = require('../../config/firebase');

exports.generateToken = (user) => {
  const token = jwt.sign({ ...user }, process.env.JWT_SECRET, { expiresIn: 86400 })
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
  // return client.verifyIdToken({
  //   idToken: token,
  //   audience: process.env.CLIENT_ID
  // })
  return new Promise((resolve,reject)=>{
  admin
  .auth()
  .verifyIdToken(token)
  .then((decodedToken) => {
    console.log(decodedTokenToken)
    const uid = decodedToken.uid;
    admin
    .auth()
    .getUser(uid)
    .then((userRecord) => {
    resolve(userRecord)
    })
  .catch((error) => {
   console.log('Error fetching user data:', error);
  });
})
  })
  .catch((error) => {
    reject(error)
  });


}
