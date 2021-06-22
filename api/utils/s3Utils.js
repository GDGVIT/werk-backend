const s3 = require('../../config/s3Bucket')

exports.uploadFile = async (filename, body, bucket) => {
  return new Promise((resolve, reject) => {
    const params = {
      Key: filename,
      Body: body,
      Bucket: bucket
    }
    s3.upload(params, (error, data) => {
      if (error) reject(error)
      else {
        resolve(data)
      }
    })
  })
}
