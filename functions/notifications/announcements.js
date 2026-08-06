const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { sendEmail } = require("../services/brevo");
const { sendSms } = require("../services/termii");
const { notifyStaff, getStaffUids } = require("../services/push");

/**
 * Fires when an admin creates a doc in `announcements`:
 *   { title, body, broadcastToParents: boolean, createdBy }
 * Always pushes an in-app + browser notification to all staff.
 * If broadcastToParents is true, also blasts SMS + email to every
 * guardian on file (respects Settings > "Emergency SMS Broadcast" toggle
 * for the SMS leg, since that's the higher-cost/most-intrusive channel).
 */
exports.onAnnouncementCreate = onDocumentCreated(
  {
    document: "announcements/{announcementId}",
    region: "europe-west1",
    secrets: ["BREVO_API_KEY", "BREVO_SENDER_EMAIL", "BREVO_SENDER_NAME", "TERMII_API_KEY", "TERMII_SENDER_ID"],
  },
  async (event) => {
    const announcement = event.data ? event.data.data() : null;
    if (!announcement) return null;

    const db = admin.firestore();

    const staffUids = await getStaffUids();
    await notifyStaff({
      uids: staffUids,
      type: "announcement",
      title: announcement.title || "School Announcement",
      body: announcement.body || "",
      data: { route: "/dashboard" },
    });

    if (!announcement.broadcastToParents) return null;

    const [settingsSnap, studentsSnap] = await Promise.all([
      db.collection("settings").doc("notifications").get(),
      db.collection("students").get(),
    ]);
    const smsEnabled = settingsSnap.exists ? settingsSnap.data().emergencySms !== false : true;

    const seen = new Set(); // dedupe guardians shared across siblings
    const jobs = [];

    studentsSnap.docs.forEach((doc) => {
      const student = doc.data();
      const key = student.guardianContact || student.guardianEmail;
      if (!key || seen.has(key)) return;
      seen.add(key);

      const messageBody = `ScholarQ Announcement: ${announcement.title}\n${announcement.body}`;

      if (smsEnabled && student.guardianContact) {
        jobs.push(sendSms({ to: student.guardianContact, message: messageBody }).catch((err) => console.error("Announcement SMS failed:", err.message)));
      }
      if (student.guardianEmail) {
        jobs.push(
          sendEmail({
            to: student.guardianEmail,
            toName: student.guardian,
            subject: announcement.title || "School Announcement",
            html: `<p>${(announcement.body || "").replace(/\n/g, "<br/>")}</p>`,
            text: announcement.body,
          }).catch((err) => console.error("Announcement email failed:", err.message))
        );
      }
    });

    await Promise.all(jobs);
    return null;
  }
);
