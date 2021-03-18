const pool = require("../../config/db");
const { BadRequest, InternalServerError, Unauthorized } = require("../utils/errors");
const { sendAccessCode } = require("../utils/email");
const { getOne, getConn,updateOne,insertOne } = require("../../db");
const { generateToken, hashIt, verifyHash,verifyAccessToken } = require("../utils");
const crypto = require("crypto")
require("dotenv").config()


exports.createSession = async (req,res)=>{
    try {
        const connection = await getConn(pool);
        try {
            //start time and end time format === YYYY-MM-DD HH:MM:SS
            const { startTime,endTime,taskCreationByAll,taskAssignByAll,participants } = req.body;
            if(!startTime || !endTime || !taskCreationByAll || !taskAssignByAll || !participants.length) throw new BadRequest("All required fields are not provided");
            const accessCode = crypto.randomBytes(5).toString('hex');
            const result = await getOne(connection,{
                tables:'users',
                fields:'userId,email',
                conditions:'email in (?)',
                values:[participants]

            })

            if(!result.length) throw new BadRequest("Provided emails are not registered with any of our user")
            
            
            const data={
                startTime,
                endTime,
                createdBy:req.user.userId,
                assignByAll:taskAssignByAll,
                taskByAll:taskCreationByAll,
                accessCode
            }
            const session = await insertOne(connection,{
                tables:'sessions',
                data
            })
            result.splice(0,0,{userId:req.user.userId,email:req.user.email})

            result.forEach(async (p,i)=>{
                await insertOne(connection,{
                    tables:'participants',
                    data:{
                        s_id:session.insertId,
                        userId:p.userId,
                        joined:i==0?1:0
                    }
                })
                if(i!==0) await sendAccessCode(accessCode,p.email,req.user.name)
            })
           
           res.status(200).json({
               session:{sessionId:session.insertId,...data}
           })


      
        } finally {
            pool.releaseConnection(connection);
        }
    } catch (e) {
        console.log(e)
        if (e.status) {
            res.status(e.status).json({
                error: e.message,
            });
        }else {
            res.status(500).json({
                error:e.toString()
            })
        }
    }
}


exports.joinSession = async (req,res)=>{
    try {
        const connection = await getConn(pool);
        try {
            //start time and end time format === YYYY-MM-DD HH:MM:SS
            const { accessCode} = req.body;
            
            const session = await getOne(connection,{
                tables:'(select * from sessions where accessCode=?) as userSessions inner join users',
                fields:'s_id,startTime,endTime,createdBy,users.name as creator_name, users.email as creator_email ',
                conditions:'userSessions.createdBy=users.userId',
                values:[accessCode]
            })
            console.log(session)
            if(!session.length) throw new BadRequest("No session is associated with the given accessCode");

            const participant = await getOne(connection,{
                tables:'participants',
                fields:'id,joined',
                conditions:'userId=? and s_id=?',
                values:[req.user.userId,session[0].s_id]
            })

            if(participant.length===0) throw new BadRequest("You have not been invited to this session");
            if(participant[0].joined) throw new BadRequest("You have already joined this session");
            await updateOne(connection,{
                tables:'participants',
                fields:'joined=?',
                conditions:'id=?',
                values:[1,participant[0].id]
            })
           res.status(200).json({
               session:session[0]
           })


      
        } finally {
            pool.releaseConnection(connection);
        }
    } catch (e) {
        console.log(e)
        if (e.status) {
            res.status(e.status).json({
                error: e.message,
            });
        }else {
            res.status(500).json({
                error:e.toString()
            })
        }
    }
}

exports.getSessions = async(req,res)=>{
    try {
        const connection = await getConn(pool);
        try {
            const sessions = await getOne(connection,{
                tables:`(select s_id,startTime,endTime,accessCode,createdAt,noOfParticipantsJoined,createdBy 
                    from (select s_id,count(id) as noOfParticipantsJoined from participants 
                    where s_id in (select s_id from participants where userId=? and joined=1 ) and participants.joined=1 group by s_id) as p
                     natural join sessions) as userSessions inner join users`,
                fields:'userSessions.*,users.name as creator_name,users.email as creator_email ',
                conditions:'userSessions.createdBy=users.userId',
                values:[req.user.userId]
            })

            res.status(200).json({
                sessions:[...sessions]
            })
        } finally {
            pool.releaseConnection(connection);
        }
    } catch (e) {
        console.log(e)
        if (e.status) {
            res.status(e.status).json({
                error: e.message,
            });
        }else {
            res.status(500).json({
                error:e.toString()
            })
        }
    }
}


exports.getParticipants = async(req,res)=>{
    try {
        const connection = await getConn(pool);
        try {
            const s_id = req.params.id;
            const users = await getOne(connection,{
                tables:'(select * from participants where s_id=?) as p natural join users order by points desc',
                fields:'userId,name,email,points,joined',
                conditions:'',
                values:[s_id]
            })
            if(users.findIndex(u=>u.userId==req.user.userId)===-1) throw new BadRequest("you are not a participant of this session");

            res.status(200).json({
                participants:[...users]
            })
        } finally {
            pool.releaseConnection(connection);
        }
    } catch (e) {
        console.log(e)
        if (e.status) {
            res.status(e.status).json({
                error: e.message,
            });
        }else {
            res.status(500).json({
                error:e.toString()
            })
        }
    }
}






