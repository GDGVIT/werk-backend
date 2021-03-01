const { BadRequest, InternalServerError, Unauthorized } = require("../utils/Errors");
const pool = require("../../config/db");
const { getConn, getOne } = require("../../db");
const { verifyToken } = require("../utils");

const authMiddleware = async (req, res,next ) => {
    try {
        const connection = await getConn(pool);
        try {
            if (!res.header["Authorization"]) 
                throw new Unauthorized("PLEASE LOGIN! NO AUTH TOKEN");
            
            const token = res.header["Authorization"].replace("Bearer ","");
            const user = verifyToken(token);

            const searchedUser = await getOne(connection, {
                fileds: `userId, email, avatar, name, emailVerified`,
                tables: `users`,
                where: `userId=?`,
                values: [user.userId],
            });
            console.log(searchedUser);

            if(!searchedUser.length) throw new Unauthorized("USER DOESN'T EXIST! PLEASE REGISTER");

            if(!searchedUser[0].emailVerfied) throw new Unauthorized("USER'S EMAIL IS NOT VERIFIED!")

            req.user = searchedUser[0];

            next()

        } finally {
            pool.releaseConnection(connection)
        }
    } catch (e) {
        //check for more errors that we didnt list!
        if(e.status){
            res.status(e.status).json({
                error:e.message
            })
        }else{
            console.log("error:::::not listed:::::",e)
        }
    }
};

module.exports = authMiddleware;