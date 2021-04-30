const admin = require("firebase-admin");
require("dotenv").config()
const serviceAccount = require(process.env.PATH_TO_CREDS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin