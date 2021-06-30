const customError = require('./CustomError')
const { StatusCodes } = require('http-status-codes')
class BadRequest extends customError {
  constructor (m) {
    super(m)
    this.status = StatusCodes.BAD_REQUEST
    this.error = m.message
  }
}

module.exports = BadRequest
