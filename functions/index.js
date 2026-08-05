const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Callable Cloud Function: redeemInviteCode
 * Validates passcode existence, expiration, and usage status,
 * then atomically writes user profile `/users/{uid}` and marks passcode `used: true`.
 */
exports.redeemInviteCode = functions.https.onCall(async (data, context) => {
  const { code, uid, name, email } = data;

  if (!code || !uid || !email) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Passcode, UID, and Email are required."
    );
  }

  const cleanCode = code.trim().toUpperCase();
  const inviteRef = db.collection("inviteCodes").doc(cleanCode);
  const userRef = db.collection("users").doc(uid);

  return await db.runTransaction(async (transaction) => {
    const inviteDoc = await transaction.get(inviteRef);

    if (!inviteDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Invalid passcode. Please check the code and try again."
      );
    }

    const inviteData = inviteDoc.data();

    if (inviteData.used) {
      throw new functions.https.HttpsError(
        "already-exists",
        "This passcode has already been used."
      );
    }

    const now = Date.now();
    const expiresAt = inviteData.expiresAt ? (inviteData.expiresAt.toMillis ? inviteData.expiresAt.toMillis() : inviteData.expiresAt) : Number.MAX_SAFE_INTEGER;

    if (expiresAt < now) {
      throw new functions.https.HttpsError(
        "deadline-exceeded",
        "This passcode has expired. Please request a new invitation from your administrator."
      );
    }

    // Prepare profile document
    const userProfile = {
      uid,
      email,
      name: name || email.split("@")[0],
      role: inviteData.role || "teacher",
      schoolId: inviteData.schoolId || "sch_main",
      assignedClasses: inviteData.assignedClasses || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 1. Create user profile doc
    transaction.set(userRef, userProfile);

    // 2. Mark code as used
    transaction.update(inviteRef, {
      used: true,
      usedBy: uid,
      usedByEmail: email,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, profile: userProfile };
  });
});
