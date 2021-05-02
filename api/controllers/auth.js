
const { BadRequest, Unauthorized } = require('../utils/errors')
// const { sendOTP } = require('../utils/email')
const { generateToken, hashIt, verifyHash, verifyAccessToken } = require('../utils')
const User = require('../models/user')

require('dotenv').config()

exports.googleAuth = async (req, res) => {
  try {
    const { accessToken } = req.body
    if (!accessToken) throw new BadRequest('ACCESS TOKEN NOT SPECIFIED')
    const user = await verifyAccessToken(accessToken)
    let searchedUser = await User.findOne({
      attributes: { exclude: ['password'] },
      where: {
        email: user.email
      }
    })
    if (!searchedUser) {
      const result = await User.create({
        name: user.displayName || '',
        email: user.email,
        avatar: user.photoURL || process.envv.DEFAULT_AVATAR,
        emailVerified: true
      })
      searchedUser = result
    }
    const token = generateToken({
      userId: searchedUser.userId
    })

    res.status(200).json({
      token,
      userDetails: {
        name: searchedUser.name,
        email: searchedUser.email,
        avatar: searchedUser.avatar,
        userId: searchedUser.userId
      }
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) throw new BadRequest('Required data not provided')

    const searchedUser = await User.findAll({
      attributes: { exclude: ['password'] },
      where: {
        email: email
      }
    })

    console.log(searchedUser)

    if (searchedUser.length) { throw new BadRequest('Email is already registered!') }

    const hashedPassword = await hashIt(password)

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    const token = generateToken({
      userId: user.userId
    })

    res.status(200).json({
      token,
      userDetails: {
        name,
        email,
        avatar: user.avatar,
        userId: user.userId
      }
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) throw new BadRequest('Required data is not provided')
    const searchedUser = await User.findAll({
      where: {
        email: email
      }
    })
    if (!searchedUser.length) throw new Unauthorized('Email is not registered with us!')

    if (!searchedUser[0].emailVerified) throw new Unauthorized('Email is not verified!')
    const check = await verifyHash(password, searchedUser[0].password)

    if (!check) throw new Unauthorized('Password is incorrect!')

    const token = generateToken({
      userId: searchedUser[0].userId
    })

    res.status(200).json({
      token,
      userDetails: {
        name: searchedUser[0].name,
        email,
        avatar: searchedUser[0].avatar,
        userId: searchedUser[0].id
      }
    })
  } catch (e) {
    console.log(e)
    res.status(e.status || 500).json({
      error: e.status ? e.message : e.toString()
    })
  }
}

// delayed verification-user gets to verify his/her email in the second login!
// exports.sendEmail = async (req, res) => {
//     try {
//       const { email } = req.body

//       // const searchedUser = await getOne(connection, {
//       //   fields: 'email, emailVerified',
//       //   tables: 'users',
//       //   conditions: 'email=?',
//       //   values: [email]
//       // })
//       const searchedUser = await User.findAll({
//         attributes:{
//           exclude:['password']
//         },
//         where:{
//           email:email
//         }
//       })
//       if (!searchedUser.length) throw new BadRequest('Email is not registered with us!')
//       if (searchedUser[0].emailVerified) throw new BadRequest('Email is already verified!')

//       const result = await sendOTP(searchedUser[0])
//       res.status(200).json({
//         message: result
//       })
//   } catch (e) {
//     console.log(e)
//     res.status(e.status||500).json({
//       error: e.status?e.message:e.toString()
//     })
// }
// }

// exports.verifyEmail = async (req, res) => {
//     try {
//       const { email, otp } = req.body

//       // const searchedUser = await getOne(connection, {
//       //   fields: 'userId, email, name, avatar, password,otp,otp_expiry,emailVerified',
//       //   tables: 'users',
//       //   conditions: 'email=? ',
//       //   values: [email]
//       // })
//       const searchedUser = await User.findAll({
//         attributes:{
//           exclude:['password']
//         },
//         where:{
//           email:email
//         }
//       })
//       if (!searchedUser.length) throw new BadRequest('Email is not registered with us!')
//       if (searchedUser[0].emailVerified) throw new BadRequest('Email is already verified!')

//       if (searchedUser[0].otp !== otp) throw new BadRequest('OTP doesn't match!')
//       if (searchedUser[0].otp_expiry < new Date().getTime()) throw new BadRequest('OTP expired!')

//       // await updateOne(connection, {
//       //   tables: 'users',
//       //   fields: 'emailVerified=?',
//       //   conditions: 'email=?',
//       //   values: [1, email]
//       // })

//       searchedUser[0].emailVerified=true;
//       await searchedUser[0].save();

//       // const token = generateToken({
//       //     userId: searchedUser[0].userId,
//       //     name: searchedUser[0].name,
//       //     email: searchedUser[0].email,
//       // });

//       res.status(200).json({
//         // token,
//         // userDetails:{
//         //     name:searchedUser[0].name,
//         //     email,
//         //     avatar:searchedUser[0].avatar,
//         //     userId:searchedUser[0].id
//         // }
//         message: 'Email Verified! Redirect user to login'
//       })
//   }catch (e) {
//     console.log(e)
//     res.status(e.status||500).json({
//       error: e.status?e.message:e.toString()
//     })
// }
// }
