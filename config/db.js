require('dotenv').config()
const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE,process.env.USER,process.env.PASSWORD,{
  dialect:'mysql',
  host:process.env.HOSTDB,
  logging:process.env.TESTING?true:false
})

module.exports = sequelize;