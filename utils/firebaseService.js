const admin = require("firebase-admin");
const path = require("path");

// =========================================
// 🚀 INITIALIZE FIREBASE ADMIN SDK
// =========================================
try {
  // Try the standard filename first, then fall back to the double-extension filename
  let serviceAccountPath;
  const fs = require("fs");
  const standardPath = path.resolve(__dirname, "../firebase-service-account.json");
  const doubleExtPath = path.resolve(__dirname, "../firebase-service-account.json.json");

  if (fs.existsSync(standardPath)) {
    serviceAccountPath = standardPath;
  } else if (fs.existsSync(doubleExtPath)) {
    serviceAccountPath = doubleExtPath;
    console.log("⚠️  Note: Loaded firebase-service-account.json.json (double extension). Rename it to firebase-service-account.json for best practice.");
  } else {
    throw new Error("firebase-service-account.json not found in backend folder");
  }

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin Initialized Successfully");
} catch (error) {
  console.log("=============================================================");
  console.log("⚠️ FIREBASE ADMIN FAILED TO INITIALIZE:", error.message);
  console.log("Make sure you downloaded 'firebase-service-account.json'");
  console.log("from your Firebase project settings and placed it in the backend folder.");
  console.log("=============================================================");
}

// =========================================
// 📬 SEND PUSH NOTIFICATION
// =========================================
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) {
    console.log("Cannot send push notification: No FCM Token provided");
    return false;
  }

  // Firebase requires ALL data values to be strings
  const stringData = {};
  for (const [key, value] of Object.entries(data)) {
    stringData[key] = String(value);
  }

  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: stringData,
      android: {
        priority: 'high',
        notification: {
          channelId: 'high_importance_channel',
          sound: 'default',
        }
      },
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Push notification sent:", response);
    return true;

  } catch (error) {
    console.error("❌ Push notification error:", error.code, error.message);
    return false;
  }
};

module.exports = {
  sendPushNotification,
};
