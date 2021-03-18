const pool = require("../../config/db");
const { BadRequest, InternalServerError, Unauthorized } = require("../utils/Errors");
const { sendOTP } = require("../utils/email");
const { getOne, getConn,updateOne,insertOne } = require("../../db");
const { generateToken, hashIt, verifyHash,verifyAccessToken } = require("../utils");
require("dotenv").config()



exports.googleAuth = async (req, res) => {
    try {
        const connection = await getConn(pool);
        try {
            const { accessToken } = req.body;

            if (!accessToken)
                throw new BadRequest("ACCESS TOKEN NOT SPECIFIED");

            const ticket = await verifyAccessToken(accessToken);

            const { email, name, picture } = ticket.getPayload();

            const searchedUser = await getOne(connection, {
                fields: `userId, email, name, avatar`,
                tables: `users`,
                conditions: `email=?`,
                values: [email],
            });

            if (!seachedUser.length) {
                if (!picture) picture = process.env.DEFAULT_AVATAR;

                const result = await insertOne(connection, {
                    tables: 'users',
                    data: {name,avatar:picture,email,emailVerified:1}
                });
                searchedUser[0].userId=result.insertId;
                searchedUser[0].name=name;
                searchedUser[0].email=email;
                searchedUser[0].avatar=picture;
            }

            const token = generateToken({
                userId: searchedUser[0].userId,
                name: searchedUser[0].name,
                email: searchedUser[0].email,
            });

            return res.status(200).json({
                token,
                userDetails:{
                    name:searchedUser[0].name,
                    email:searchedUser[0].email,
                    avatar:searchedUser[0].avatar,
                    userId:searchedUser[0].userId
                },
            });
        } finally {
            pool.releaseConnection(connection);
        }
    } catch (e) {
        console.log(e);
        if (e.status) {
             res.status(e.status).json({
                error: e.message,
            });
        }else{
            res.status(500).json({
                error: e.toString(),
            });
        }
    }
};

exports.register = async (req, res) => {
    try {
        const connection = await getConn(pool);
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password)throw new BadRequest("Required data not provided");
            
            // if(password.length>6) throw new BadRequest("Password must be minimum of 7 chars");

            const searchedUser = await getOne(connection, {
                fields: `userId, email, name, avatar`,
                tables: `users`,
                conditions: `email=?`,
                values: [email],
            });
            if (searchedUser.length)
                throw new BadRequest("Email is already registered!");

          
            const hashedPassword = await hashIt(password);
            
          
            const result = await insertOne(connection, {
                tables: 'users',
                data:{
                    name,
                    avatar:process.env.DEFAULT_AVATAR,
                    email,
                    password:hashedPassword
                }
            });

            const token = generateToken({
                name,
                email,
                userId: result.insertId,
            });

            // const info = await sendEmail(connection, email);

            res.status(200).json({
                token,
                userDetails:{
                    name,
                    email,
                    avatar:process.env.DEFAULT_AVATAR,
                    userId:result.insertId
                }
            });
        } finally {
            pool.releaseConnection(connection);
        }
    } catch (e) {
        console.log(e)
        if (e.status) {
            res.status(e.status).json({
                error: e.message,
            });
        } else {
            res.status(500).json({
                error: e.toString(),
            });
        }
    }
};

exports.login = async (req, res) => {
    try {
        const connection = await getConn(pool);
        try {
            const {email,password} = req.body;
           
            if(!email || !password) throw new BadRequest("Required data is not provided");

 
            const searchedUser = await getOne(connection, {
                fields: `userId, email, name, avatar, password, emailVerified`,
                tables: `users`,
                conditions: `email=?`,
                values: [email],
            });


            if(!searchedUser.length) throw new Unauthorized("Email is not registered with us!");

            if(!searchedUser[0].emailVerified) throw new Unauthorized("Email is not verified!");
            console.log(password,searchedUser[0].password)
            const check = await verifyHash(password,searchedUser[0].password);

            if(!check) throw new Unauthorized("Password is incorrect!");

            const token = generateToken({
                userId: searchedUser[0].userId,
                name: searchedUser[0].name,
                email: searchedUser[0].email,
            });

            res.status(200).json({
                token,
                userDetails:{
                    name:searchedUser[0].name,
                    email,
                    avatar:searchedUser[0].avatar,
                    userId:searchedUser[0].id
                }
            })


        } finally {
            pool.releaseConnection(connection);
        }
    } catch (e) {
        console.log(e);
        if (e.status) {
            res.status(e.status).json({
                error: e.message,
            });
        } else {
            res.status(500).json({
                error: e.toString()
            });
        }
    }
};

//delayed verification-user gets to verify his/her email in the second login!
exports.sendEmail = async (req,res)=>{
    try{
        const connection = await getConn(pool);
        try{
          const {email} = req.body;

          const searchedUser = await getOne(connection, {
            fields: `email, emailVerified`,
            tables: `users`,
            conditions: `email=?`,
            values: [email],
        });
        if(!searchedUser.length) throw new BadRequest("Email is not registered with us!");
        if(searchedUser[0].emailVerified) throw new BadRequest("Email is already verified!")

          const result = await sendOTP(connection,email);
          res.status(200).json({
            message:result
          })

        }finally{
          pool.releaseConnection(connection)
        }
    }catch(e){
        console.log(e);
         if(e.status){
            
             res.status(500).json({
                 error:e.message
             })
         }else{
            res.status(500).json({
                error: e.toString()
            });
         }
    }
}

exports.verifyEmail = async (req,res)=>{
    try{
        const connection = await getConn(pool);
        try{
          const {email,otp} = req.body;

        const searchedUser = await getOne(connection, {
            fields: `userId, email, name, avatar, password,otp,otp_expiry,emailVerified`,
            tables: `users`,
            conditions: `email=? `,
            values: [email],
        });
         
        if(!searchedUser.length) throw new BadRequest("Email is not registered with us!");
        if(searchedUser[0].emailVerified) throw new BadRequest("Email is already verified!");

        if(searchedUser[0].otp!==otp) throw new BadRequest("OTP doesn't match!");
        if(searchedUser[0].otp_expiry<new Date().getTime()) throw new BadRequest("OTP expired!");

        await updateOne(connection, {
            tables:"users",
            fields:"emailVerified=?",
            conditions:"email=?",
            values:[1,email]
        });

        // const token = generateToken({
        //     userId: searchedUser[0].userId,
        //     name: searchedUser[0].name,
        //     email: searchedUser[0].email,
        // });

        res.status(200).json({
            // token,
            // userDetails:{
            //     name:searchedUser[0].name,
            //     email,
            //     avatar:searchedUser[0].avatar,
            //     userId:searchedUser[0].id
            // }
            message:"Email registered! Redirect user to login"
        })
        }finally{
          pool.releaseConnection(connection)
        }
    }catch(e){
        console.log(e)
        if(e.status){
            res.status(e.status).json({
                error:e.message
            })
        }
        else{
            res.status(500).json({
                error: e.toString()
            });
        }
    }
}