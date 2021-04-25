// const mysql = require('mysql')


// const pool = mysql.createPool({
//   host: process.env.HOSTDB,
//   user: process.env.USER,
//   password: process.env.PASSWORD,
//   database: process.env.DATABASE
// })

// module.exports = pool
require('dotenv').config()
const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE,process.env.USER,process.env.PASSWORD,{
  dialect:'mysql',
  host:process.env.HOSTDB
})

module.exports = sequelize;