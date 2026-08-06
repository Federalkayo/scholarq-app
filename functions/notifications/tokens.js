const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

/**
 * Callable: saveFcmToken
 * Registers a browser's FCM token against the logged-in staff user so
 * Cloud Functions can push real browser notifications to them later.
 */
exports.saveFcmToken = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to enable notifications.");
  }
  const { token, platform } = request.data || {};
  if (!token) {
    throw new HttpsError("invalid-argument", "A device token is required.");
  }

  const db = admin.firestore();
  await db
    .collection("users")
    .doc(request.auth.uid)
    .collection("fcmTokens")
    .doc(token)
    .set({
      token,
      platform: platform || "web",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  return { success: true };
});

/** Callable: removeFcmToken — call on logout / when the user disables notifications. */
exports.removeFcmToken = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }
  const { token } = request.data || {};
  if (!token) return { success: true };

  const db = admin.firestore();
  await db.collection("users").doc(request.auth.uid).collection("fcmTokens").doc(token).delete();
  return { success: true };
});

/** Callable: markNotificationRead */
exports.markNotificationRead = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }
  const { notificationId } = request.data || {};
  if (!notificationId) {
    throw new HttpsError("invalid-argument", "notificationId is required.");
  }
  const db = admin.firestore();
  const ref = db.collection("notifications").doc(notificationId);
  const snap = await ref.get();
  if (!snap.exists || snap.data().recipientUid !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Not your notification.");
  }
  await ref.update({ read: true });
  return { success: true };
});
