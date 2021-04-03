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

const { getOne, getConn, insertOne } = require('./db')
const pool = require('./config/db')
const { verifyToken } = require('./api/utils')

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

// app.use("/*",(req,res)=>{
//     res.status(404).json({
//       error:"page not found!!"
//     });

// })

// SERVER
const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
  console.log('server started at: ' + PORT)
})

const io = socket(server, {
  cors: {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false
  }
})

io.on('connection', async (socket) => {
  console.log('connectedsjsfakkjfalkted!')
  try {
    const connection = await getConn(pool)
    try {
    // have to make seperate functions each
      socket.on('initialize', async (data) => {
        console.log('initialized', typeof data, data.token)
        if (!data.token) throw new Error('token not passed')
        const user = verifyToken(data.token)
        socket.on('joinSession', async (data) => {
          // data contains sessionID
          console.log('joined session')
          console.log(user)
          if (!data.session) throw new Error('sessionId or token not passed')
          const result = await getOne(connection, {
            tables: 'participants',
            fields: 's_id',
            conditions: 'userId=? and s_id=? and joined=1',
            values: [user.userId, data.session]

          })
          console.log(result)
          if (result.length === 0) throw new Error('User is not in that session')
          const room = `session-${result[0].s_id}`
          socket.join(room)

          let messages = await getOne(connection, {
            tables: 'groupchats inner join users',
            fields: 'message,users.name as sentBy,users.email as senderEmail,sentTime',
            conditions: 'sentIn=? and users.userId=groupchats.sentBy order by sentTime asc',
            values: [result[0].s_id]
          })

          messages = messages.map(m => {
            return {
              ...m,
              sender: m.sentBy === user.userId
            }
          })

          socket.emit('oldmessages', (messages))

          socket.on('message', async (messageData) => {
            console.log('message')
            // message data contains
            console.log(user)
            socket.to(room).emit('message', messageData)
            await insertOne(connection, {
              tables: 'groupchats',
              data: {
                message: messageData.message,
                sentBy: user.userId,
                sentIn: result[0].s_id
              }
            })
          })

          socket.on('disconnect', () => {
            socket.leave(room)
          })
        })
      })
    } finally {
      pool.releaseConnection(connection)
    }
  } catch (e) {
    if (e) {
      console.log(e)
      socket.disconnect(true)
    }
  }
})
