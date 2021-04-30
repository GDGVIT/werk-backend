const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const socket = require('socket.io')
// const expressRL = require("express-rate-limiter");
const dotenv = require('dotenv')
const helmet = require('helmet')
const authRoutes = require('./api/routes/auth')
const sessionRoutes = require('./api/routes/session')
const chatRoutes= require('./api/routes/chat')
const { getOne, getConn, insertOne } = require('./db')
const pool = require('./config/db')
const { verifyToken } = require('./api/utils')
const sequelize = require('./config/db')
const User = require('./api/models/user');
const Session = require('./api/models/session');
const Participant = require('./api/models/participant')
const GroupChat = require('./api/models/chat')
dotenv.config()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

if (!process.env.TESTING) {
  app.use(morgan('tiny'))
}

// helmet
app.use(helmet())

// cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
    return res.status(200).json({})
  }
  next()
})

// ROUTES
app.use('/auth', authRoutes)
app.use('/session', sessionRoutes)
app.use('/chats',chatRoutes)


//associations
Session.belongsTo(User,{foreignKey:{name:'createdBy',allowNull:false}})
User.belongsToMany(Session,{through:Participant,foreignKey:'userId'})
Session.belongsToMany(User,{through:Participant, foreignKey:'sId'})
GroupChat.belongsTo(User,{foreignKey:{name:'sentBy',allowNull:false}})
GroupChat.belongsTo(Session,{foreignKey:{name:'sentIn',allowNull:false}})




//syncing tables
  sequelize.sync()
  .then(result=>{

    const PORT = process.env.PORT || 3000
  const server = app.listen(PORT, () => {
    console.log('server started at: ' + PORT)
  })

  //initialization of socket with cors config
  const io = socket(server, {
    cors: {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false
    }
  })
  
  

  io.on('connection', async (socket) => {
        let user = null;
        let session = null;
        let currentRoom = null;
      // in app are we gonna disconnect the socket when he moves to different screen ?? - if no then seperate everything which is kept inside!!
        console.log("connected!")
        //INITIALIZATION OF THE USER!
        socket.on('initialize', async (data) => {
          if(!user){
            if (!data.token){
              console.log('token not passed!!!')
              return
            }
              console.log("initialized")
              user = verifyToken(data.token)
          }
         else console.log("already intialized!!")
        })

        //MESSAGE SENT!
        socket.on('message', async (messageData) => {
          if(!user){ console.log('USER IS NOT AUTHENTICATED!');return}
          if(!session){ console.log('USER DINDT JOIN ANY SESSION YET');return}
            if(messageData.message){
              socket.to(currentRoom).emit('message', messageData)
              let date = new Date();
              //this epoch time is of utc standard
              console.log("MESSAGE TIME : "+date);
  
              await GroupChat.create({
                  message:messageData.message,
                  sentBy:user.userId,
                  sentIn:session,
                  sentTime:date.getTime()
              })
            }else{
              console.log("nothing is sent in the message Data!")
            }
        })

        //JOINING A SESSION
        socket.on('joinSession', async (data) => {
          // data contains sessionID
          if(session){
            console.log('didnt leave the prev session yet')
            return
          }
          if (!data.session || !user){
            console.log('session ID not passed','user: '+user)
            return
          }
 
            session = data.session;
            const participant = await Participant.findAll({
              where:{
                userId:user.userId,
                sId:data.session,
                joined:true
              }
            })
            console.log(participant.length)
            if (participant.length === 0) {
              console.log("user is not in the session")
              return
            }
              const currentRoom = `session-${session}`
              socket.join(currentRoom)
              console.log("joined room: "+currentRoom);
        })

        socket.on('leaveSession', () => {
          if(session==null){
            console.log("NOT IN ANY SESSION")
            return
          }
          socket.leave(currentRoom);
          currentRoom=null;
          sessoin=null;
          console.log('user left the session')
        })

  })


  }).catch(e=>{
    console.log(e)
  })

  //sync successful
  //server creation
  