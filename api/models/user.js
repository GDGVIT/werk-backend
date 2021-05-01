const Sequelize = require('sequelize')
const sequelize = require('../../config/db')
require('dotenv').config()

const User = sequelize.define('user', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  avatar: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: process.env.DEFAULT_AVATAR
  },
  userId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: true
  },
  emailVerified: {
    type: Sequelize.BOOLEAN,
    // we can later implement the verification route
    defaultValue: true
  },
  otpExpiry: {
    type: Sequelize.BIGINT
  },
  otp: {
    type: Sequelize.STRING
  }

}, {
  timestamps: true
})

module.exports = User
