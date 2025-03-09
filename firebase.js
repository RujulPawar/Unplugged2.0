const admin = require("firebase-admin");
const serviceAccount = require("./smartcity-1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
