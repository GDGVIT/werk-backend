const aws = require('aws-sdk')
require('dotenv').config()

const s3 = new aws.S3({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID
})

module.exports = s3
