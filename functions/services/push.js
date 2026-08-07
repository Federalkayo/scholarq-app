const admin = require("firebase-admin");

/**
 * Writes an in-app notification doc (powers the Topbar bell + the
 * Claude-style toast popup on the frontend) and, if the recipient has
 * registered device tokens, sends a real browser push via FCM too.
 *
 * @param {object} opts
 * @param {string[]} opts.uids - user ids (from /users) to notify
 * @param {string} opts.type - 'fee' | 'attendance' | 'announcement' | 'system'
 * @param {string} opts.title
 * @param {string} opts.body
 * @param {object} [opts.data] - extra payload (e.g. { studentId, route })
 */
async function notifyStaff({ uids, type = "system", title, body, data = {} }) {
  const db = admin.firestore();
  const targets = [...new Set((uids || []).filter(Boolean))];
  if (targets.length === 0) return { notified: 0 };

  const batch = db.batch();
  targets.forEach((uid) => {
    const ref = db.collection("notifications").doc();
    batch.set(ref, {
      recipientUid: uid,
      type,
      title,
      body,
      data,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();

  // Best-effort push to registered browser tokens; failures here should
  // never block the in-app notification from having been written above.
  try {
    const tokenSnaps = await Promise.all(
      targets.map((uid) => db.collection("users").doc(uid).collection("fcmTokens").get())
    );
    const tokens = tokenSnaps.flatMap((snap) => snap.docs.map((d) => d.id));

    if (tokens.length > 0) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: Object.fromEntries(Object.entries({ type, ...data }).map(([k, v]) => [k, String(v)])),
        webpush: {
          fcmOptions: { link: data.route || "/" },
          notification: { icon: "/scholarq-icon.png" },
        },
      });

      // Clean up dead tokens so we don't keep retrying them.
      const deletions = [];
      response.responses.forEach((r, i) => {
        if (!r.success && ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(r.error?.code)) {
          const badToken = tokens[i];
          targets.forEach((uid) => {
            deletions.push(db.collection("users").doc(uid).collection("fcmTokens").doc(badToken).delete().catch(() => {}));
          });
        }
      });
      await Promise.all(deletions);
    }
  } catch (err) {
    console.error("Push dispatch failed (in-app notification still saved):", err);
  }

  return { notified: targets.length };
}

/** Fetches uids for all staff, optionally filtered by role. */
async function getStaffUids({ roles } = {}) {
  const db = admin.firestore();
  let q = db.collection("users");
  const snap = await q.get();
  return snap.docs
    .filter((d) => !roles || roles.includes(d.data().role))
    .map((d) => d.id);
}

/**
 * Fetches full staff docs (uid + profile fields), optionally filtered by role.
 * Use this instead of getStaffUids when the caller needs to filter further,
 * e.g. by a teacher's assignedClasses before sending class-scoped alerts.
 */
async function getStaffProfiles({ roles } = {}) {
  const db = admin.firestore();
  const snap = await db.collection("users").get();
  return snap.docs
    .filter((d) => !roles || roles.includes(d.data().role))
    .map((d) => ({ uid: d.id, ...d.data() }));
}

module.exports = { notifyStaff, getStaffUids, getStaffProfiles };
