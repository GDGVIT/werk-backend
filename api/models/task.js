const Sequelize  = require("sequelize");
const sequelize = require("../../config/db");


const User = sequelize.define('user',{
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
        type:Sequelize.STRING,
        allowNull:false
    },
    title:{
        type:Sequelize.STRING,
        allowNull:false
    },
    assignedTo:{
        type:Sequelize.STRING,
        allowNull:true
    },
    createdBy:{
        type:Sequelize.BOOLEAN,
        defaultValue: false
    },
    givenIn:{

    },
    expectedTime:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    pointsExpected:{
        type:Sequelize.DOUBLE,
        allowNull:false
    },
    pointsRewarded:{
        type:Sequelize.DOUBLE,
        defaultValue:0.0
    },
    


},{
    timestamps:true
})

module.exports = User;