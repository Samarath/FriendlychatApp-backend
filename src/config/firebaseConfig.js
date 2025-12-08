const admin = require("firebase-admin");
const path = require("path");

const PROJECT_ID = "chat-app-6a2a8";

// Load the Service Account Key file
// This file grants your backend full admin access to your Firebase/Google Cloud resources.
const serviceAccountPath = `D:/Work/Chat app/key/serviceAccountKey.json`;
const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Used for the bucket name for Google Cloud Storage
    storageBucket: `${PROJECT_ID}.appspot.com`,
  });
}

// Export the necessary service references
const db = admin.firestore();
const storage = admin.storage();

module.exports = {
  db,
  storage,
  admin,
};
