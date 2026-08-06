const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { sendEmail } = require("../services/brevo");
const { sendSms } = require("../services/termii");
const { notifyStaff, getStaffUids } = require("../services/push");

function daysBetween(dueDateStr) {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000); // negative = overdue
}

/**
 * Runs daily at 7am (Africa/Lagos). Scans unpaid invoices in `fees` and:
 *  - texts/emails guardians for invoices due today, in 3 days, or overdue
 *  - pushes a single digest notification to admin/teacher staff
 * Respects Settings > Notifications > "feeAlerts" toggle.
 */
exports.scheduledFeeReminders = onSchedule(
  {
    schedule: "every day 07:00",
    timeZone: "Africa/Lagos",
    region: "europe-west1",
    secrets: ["BREVO_API_KEY", "BREVO_SENDER_EMAIL", "BREVO_SENDER_NAME", "TERMII_API_KEY", "TERMII_SENDER_ID"],
  },
  async () => {
    const db = admin.firestore();

    const settingsSnap = await db.collection("settings").doc("notifications").get();
    const feeAlertsEnabled = settingsSnap.exists ? settingsSnap.data().feeAlerts !== false : true;

    const feesSnap = await db.collection("fees").where("status", "in", ["Pending", "Partially Paid", "Overdue"]).get();

    const studentCache = new Map();
    async function getStudent(studentId) {
      if (!studentId) return {};
      if (studentCache.has(studentId)) return studentCache.get(studentId);
      const snap = await db.collection("students").doc(studentId).get();
      const data = snap.exists ? snap.data() : {};
      studentCache.set(studentId, data);
      return data;
    }

    let dueSoonCount = 0;
    let overdueCount = 0;
    const jobs = [];

    for (const doc of feesSnap.docs) {
      const invoice = doc.data();
      const diff = daysBetween(invoice.dueDate);
      if (diff === null) continue;

      const isDueSoon = diff === 3 || diff === 0;
      const isOverdue = diff < 0;
      if (!isDueSoon && !isOverdue) continue;

      if (isOverdue) overdueCount++;
      else dueSoonCount++;

      if (!feeAlertsEnabled) continue;

      const balance = (Number(invoice.amount) || 0) - (Number(invoice.amountPaid) || 0);
      const messageBody = isOverdue
        ? `ScholarQ Fee Alert: ${invoice.studentName}'s ${invoice.feeType} balance of ₦${balance.toLocaleString()} was due ${Math.abs(diff)} day(s) ago. Kindly settle at your earliest convenience.`
        : `ScholarQ Fee Reminder: ${invoice.studentName}'s ${invoice.feeType} balance of ₦${balance.toLocaleString()} is due ${diff === 0 ? "today" : `on ${invoice.dueDate}`}.`;

      jobs.push(
        (async () => {
          const student = await getStudent(invoice.studentId);
          if (student.guardianContact) {
            await sendSms({ to: student.guardianContact, message: messageBody }).catch((err) =>
              console.error(`Fee SMS failed for ${invoice.studentName}:`, err.message)
            );
          }
          if (student.guardianEmail) {
            await sendEmail({
              to: student.guardianEmail,
              toName: student.guardian,
              subject: `Fee ${isOverdue ? "Overdue" : "Reminder"}: ${invoice.studentName}`,
              html: `<p>Dear ${student.guardian || "Guardian"},</p><p>${messageBody}</p>`,
              text: messageBody,
            }).catch((err) => console.error(`Fee email failed for ${invoice.studentName}:`, err.message));
          }
        })()
      );
    }

    await Promise.all(jobs);

    if (dueSoonCount + overdueCount > 0) {
      const staffUids = await getStaffUids({ roles: ["admin"] });
      await notifyStaff({
        uids: staffUids,
        type: "fee",
        title: "Daily fee reminder digest",
        body: `${overdueCount} invoice(s) overdue, ${dueSoonCount} due soon. Reminders ${feeAlertsEnabled ? "sent" : "skipped (alerts disabled)"} to guardians.`,
        data: { route: "/fees" },
      });
    }

    return null;
  }
);
