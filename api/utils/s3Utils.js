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

exports.deleteFile = async (bucket, url) => {
  const params = {
    Bucket: bucket,
    Key: 'WERK/' + url.split('/WERK/')[1]
  }
  console.log(params)
  return new Promise((resolve, reject) => {
    s3.deleteObject(params, function (err, data) {
      if (err) reject(err)
      else {
        // console.log(data)
        resolve(data)
      }
    })
  })
}
