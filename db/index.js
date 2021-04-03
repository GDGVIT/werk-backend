exports.getConn = pool => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) reject(err)
      resolve(connection)
    })
  })
}

exports.getOne = (connection, config) => {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT ${config.fields} FROM ${config.tables} ${config.conditions ? `WHERE ${config.conditions}` : ''}`, config.values, (error, result) => {
      if (error) reject(error)
      resolve(result)
    })
  })
}

exports.insertOne = (connection, config) => {
  return new Promise((resolve, reject) => {
    connection.query(`INSERT INTO ${config.tables} SET ?`, config.data, (error, result) => {
      if (error) reject(error)
      resolve(result)
    })
  })
}

exports.updateOne = (connection, config) => {
  return new Promise((resolve, reject) => {
    connection.query(`UPDATE ${config.tables} SET ${config.fields} WHERE ${config.conditions}`, config.values, (error, result) => {
      if (error) reject(error)
      resolve(result)
    })
  })
}
