const Sequelize = require('sequelize');
const sequelize = require('../../config/db');
const User = require('./user');

const Session = sequelize.define('session',{
    sessionId:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    //EPOCH TIME
    startTime:{
      type:Sequelize.BIGINT,
      allowNull:false
    },
    endTime:{
        type:Sequelize.BIGINT,
        allowNull:false
    },
    taskCreationUniv:{
        type:Sequelize.BOOLEAN,
        defaultValue:false
    },
    taskAssignUniv:{
        type:Sequelize.BOOLEAN,
        defaultValue:false
    },
    accessCode:{
        type:Sequelize.STRING,
        allowNull:false
    },
    
},{
    timestamps:true
})

module.exports = Session;