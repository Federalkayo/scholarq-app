const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { sendEmail } = require("../services/brevo");
const { sendSms } = require("../services/termii");
const { notifyStaff, getStaffUids } = require("../services/push");

/**
 * Fires on every attendance/{date_studentId} write (marking a roll call).
 * Only acts when the status is (newly) "Absent" for that record, so
 * re-saving "Present" or editing other fields won't spam parents.
 */
exports.onAttendanceWrite = onDocumentWritten(
  {
    document: "attendance/{recordId}",
    region: "europe-west1",
    secrets: ["BREVO_API_KEY", "BREVO_SENDER_EMAIL", "BREVO_SENDER_NAME", "TERMII_API_KEY", "TERMII_SENDER_ID"],
  },
  async (event) => {
    const after = event.data?.after?.exists ? event.data.after.data() : null;
    const before = event.data?.before?.exists ? event.data.before.data() : null;
    if (!after) return null;

    const becameAbsent = after.status === "Absent" && before?.status !== "Absent";
    if (!becameAbsent) return null;

    const db = admin.firestore();

    // Pull guardian contact details + settings in parallel.
    const [studentSnap, settingsSnap] = await Promise.all([
      after.studentId ? db.collection("students").doc(after.studentId).get() : null,
      db.collection("settings").doc("notifications").get(),
    ]);

    const student = studentSnap?.exists ? studentSnap.data() : {};
    const settingsEnabled = settingsSnap.exists ? settingsSnap.data().attendanceDigest !== false : true;

    const staffUids = await getStaffUids({ roles: ["admin", "teacher"] });
    await notifyStaff({
      uids: staffUids,
      type: "attendance",
      title: "Absence recorded",
      body: `${after.studentName || "A student"} (${after.classSec || "—"}) was marked absent on ${after.date}.`,
      data: { studentId: after.studentId, route: "/attendance" },
    });

    if (!settingsEnabled) return null;

    const message = `ScholarQ Attendance Alert: ${after.studentName} was marked ABSENT on ${after.date}. If this is unexpected, please contact the school office.`;

    const jobs = [];
    if (student.guardianContact) {
      jobs.push(sendSms({ to: student.guardianContact, message }).catch((err) => console.error("Attendance SMS failed:", err.message)));
    }
    if (student.guardianEmail) {
      jobs.push(
        sendEmail({
          to: student.guardianEmail,
          toName: student.guardian,
          subject: `Attendance Alert: ${after.studentName}`,
          html: `<p>Dear ${student.guardian || "Guardian"},</p><p>${message}</p>`,
          text: message,
        }).catch((err) => console.error("Attendance email failed:", err.message))
      );
    }
    await Promise.all(jobs);

    return null;
  }
);
