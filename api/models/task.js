const Sequelize  = require('sequelize');
const sequelize = require('../../config/db');
const Session = require('./session');


const Task = sequelize.define('task',{
    taskId:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    status:{
        type:Sequelize.STRING,
        allowNull:false,
    },
    description:{
        type:Sequelize.STRING(300),
        allowNull:false
    },
    title:{
        type:Sequelize.STRING,
        allowNull:false
    },
    expectedDuration:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    // in mins
    completionDuration:{
        type:Sequelize.INTEGER,
    },

    // completedDate in epoch time
    submittedDate:{
        type:Sequelize.BIGINT,
    },
    createdDate:{
        type:Sequelize.BIGINT,
        allowNull:false
    },
    // pointsExpected:{
    //     type:Sequelize.DOUBLE,
    //     allowNull:false
    // },
    points:{
        type:Sequelize.DOUBLE,
        defaultValue:0.0
    }
})

module.exports = Task;