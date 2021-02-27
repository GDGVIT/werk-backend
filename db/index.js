const SqlError = require("../api/utils/Errors/sqlError");

exports.getConn = pool =>{
      return new Promise((resolve,reject)=>{
            pool.getconnection((err,connection)=>{
                  if(err) reject(err)
                  resolve(connection)
            });
      })
}


exports.getOne = (connection,config) =>{
    return new Promise((resolve,reject)=>{
      connection.query(`SELECT ${config.fields} FROM ${config.tables} WHERE ${config.conditions}`,config.values,(error,result,fields)=>{
            if(error) reject(new (SqlError(error.message)))
            resolve(result);
           });
    })
}


exports.insertOne = (connection,config) =>{
     return new Promise((resolve,reject)=>{
      connection.query(`INSERT INTO ${config.tables} VALUES${config.questions}`,config.values,(error,result)=>{
            if(error) reject(new (SqlError(error.message)))
            resolve(result);
           });
     })
}


exports.updateOne = (connection,config) =>{
      return new Promise((resolve,reject)=>{
       connection.query(`UPDATE ${config.tables} SET ${config.fields}`,config.values,(error,result)=>{
             if(error) reject(new (SqlError(error.message)))
             resolve(result);
            });
      })
 }