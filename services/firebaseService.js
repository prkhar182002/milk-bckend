import admin from "firebase-admin";
import pool from "../config.js";

let firebaseInitialized = false;

function initFirebase() {
  if (firebaseInitialized) return;

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
      firebaseInitialized = true;
      console.log("Firebase Admin SDK initialized");
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
      firebaseInitialized = true;
      console.log("Firebase Admin SDK initialized");
    } else {
      console.warn("Firebase credentials not configured. Push notifications disabled.");
    }
  } catch (err) {
    console.error("Firebase init error:", err.message);
  }
}

initFirebase();

export async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!firebaseInitialized || !fcmToken) return null;

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: "high",
        notification: { sound: "default", channelId: "orders" },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
    };

    const response = await admin.messaging().send(message);
    return response;
  } catch (err) {
    console.error("Push notification error:", err.message);
    if (err.code === "messaging/registration-token-not-registered") {
      // Token is invalid, clear it
      await pool.query(`UPDATE riders SET fcm_token = NULL WHERE fcm_token = ?`, [fcmToken]);
    }
    return null;
  }
}

export async function sendToRider(riderId, title, body, data = {}) {
  const [rows] = await pool.query(`SELECT fcm_token FROM riders WHERE id = ?`, [riderId]);
  if (rows.length === 0 || !rows[0].fcm_token) return null;
  return sendPushNotification(rows[0].fcm_token, title, body, data);
}

export async function createNotification(recipientType, recipientId, title, body, type = "general", data = null) {
  try {
    await pool.query(
      `INSERT INTO notifications (recipient_type, recipient_id, title, body, type, data) VALUES (?, ?, ?, ?, ?, ?)`,
      [recipientType, recipientId, title, body, type, data ? JSON.stringify(data) : null]
    );
  } catch (err) {
    console.error("Create notification error:", err);
  }
}
