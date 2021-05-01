const admin = require("firebase-admin");
require("dotenv").config()
const path = require("path")
const serviceAccount = require(process.env.PATH_TO_GOOGLE_CREDS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin