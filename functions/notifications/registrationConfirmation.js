const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { sendEmail } = require("../services/brevo");
const { sendSms } = require("../services/termii");
const { notifyStaff, getStaffUids } = require("../services/push");

/**
 * Fires when a new doc is created in `students` (i.e. the "New Registration"
 * flow in Students.jsx calls addDoc, not updateDoc — edits never retrigger this).
 *
 * - Always pushes an in-app + browser notification to admin staff.
 * - If the guardian has a phone/email on file, sends a welcome SMS + email
 *   confirming enrolment. Respects Settings > Notifications > "registrationAlerts".
 * - Logs the outcome to `registrationNotifications` so staff can see delivery
 *   status, same pattern as dispatchParentNotice.
 */
exports.onStudentRegistered = onDocumentCreated(
  {
    document: "students/{studentId}",
    region: "europe-west1",
    secrets: ["BREVO_API_KEY", "BREVO_SENDER_EMAIL", "BREVO_SENDER_NAME", "TERMII_API_KEY", "TERMII_SENDER_ID"],
  },
  async (event) => {
    const student = event.data ? event.data.data() : null;
    if (!student) return null;

    const studentId = event.params.studentId;
    const db = admin.firestore();

    // Staff digest fires regardless of the guardian-alerts toggle below —
    // admins should always know a new student landed in the system.
    const staffUids = await getStaffUids({ roles: ["admin"] });
    await notifyStaff({
      uids: staffUids,
      type: "system",
      title: "New student registered",
      body: `${student.name || "A new student"} was added${student.grade ? ` to ${student.grade}${student.section ? student.section : ""}` : ""}.`,
      data: { route: "/students", studentId },
    });

    const settingsSnap = await db.collection("settings").doc("notifications").get();
    const registrationAlertsEnabled = settingsSnap.exists ? settingsSnap.data().registrationAlerts !== false : true;

    if (!registrationAlertsEnabled) return null;
    if (!student.guardianContact && !student.guardianEmail) return null;

    const messageBody = `Dear ${student.guardian || "Guardian"}, ${student.name || "your child"} has been successfully registered at our school${student.grade ? ` (${student.grade}${student.section ? student.section : ""})` : ""}. Welcome to ScholarQ!`;

    const results = {};

    if (student.guardianContact) {
      try {
        await sendSms({ to: student.guardianContact, message: messageBody });
        results.sms = { success: true };
      } catch (err) {
        results.sms = { success: false, error: err.message };
        console.error(`Registration SMS failed for ${student.name}:`, err.message);
      }
    }

    if (student.guardianEmail) {
      try {
        await sendEmail({
          to: student.guardianEmail,
          toName: student.guardian,
          subject: `Welcome to ScholarQ, ${student.name || "Student"}!`,
          html: `<p>Dear ${student.guardian || "Guardian"},</p><p>${messageBody}</p><p style="color:#666;font-size:12px;margin-top:24px">Sent via ScholarQ School Portal</p>`,
          text: messageBody,
        });
        results.email = { success: true };
      } catch (err) {
        results.email = { success: false, error: err.message };
        console.error(`Registration email failed for ${student.name}:`, err.message);
      }
    }

    await db.collection("registrationNotifications").add({
      studentId,
      studentName: student.name || "",
      guardianName: student.guardian || "",
      guardianContact: student.guardianContact || "",
      guardianEmail: student.guardianEmail || "",
      message: messageBody,
      results,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return null;
  }
);
