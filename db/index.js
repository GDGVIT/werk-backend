exports.getConn = pool =>{
      return new Promise((resolve,reject)=>{
            pool.getConnection((err,connection)=>{
                  if(err) reject(error)
                  resolve(connection);
            });
      })
}


exports.getOne = (connection,config) =>{
    return new Promise((resolve,reject)=>{
      connection.query(`SELECT ${config.fields} FROM ${config.tables} WHERE ${config.conditions}`,config.values,(error,result)=>{
            if(error) reject(error)
            resolve(result);
           });
    })
}


exports.insertOne = (connection,config) =>{
     return new Promise((resolve,reject)=>{
      connection.query(`INSERT INTO ${config.tables} VALUES${config.questions}`,config.values,(error,result)=>{
            if(error) reject(error)
            resolve(result);
           });
     })
}


exports.updateOne = (connection,config) =>{
      return new Promise((resolve,reject)=>{
       connection.query(`UPDATE ${config.tables} SET ${config.fields} WHERE ${config.conditions}`,config.values,(error,result)=>{
             if(error) reject(error)
             resolve(result);
            });
      })
 }