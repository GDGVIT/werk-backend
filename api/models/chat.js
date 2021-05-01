const Sequelize = require('sequelize');
const sequelize = require('../../config/db');

const GroupChat = sequelize.define('groupChat',{
    messageId:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    message:{
        type:Sequelize.STRING(500),
        allowNull:false,
    },
    sentTime:{
        type:Sequelize.BIGINT,
        allowNull:false
    }
})

module.exports = GroupChat