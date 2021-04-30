const Sequelize  = require("sequelize");
const sequelize = require("../../config/db");
const User = require('./user');
const Session = require('./session');


const Participant = sequelize.define('participant',{
    participantId:{
        type: Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    points:{
        type:Sequelize.DOUBLE,
        defaultValue:0.0
    },
    joined:{
        type:Sequelize.BOOLEAN,
        default:false
    }

},{
    timestamps:true
})

module.exports = Participant;