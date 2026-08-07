const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { sendEmail } = require("../services/brevo");
const { sendSms } = require("../services/termii");

/**
 * Callable: dispatchParentNotice
 * Sends the message drafted in "Smart Parent Communication" (ParentNoticeModal)
 * to the guardian over SMS (Termii) and/or email (Brevo), and logs the
 * outcome so staff can see delivery status.
 */
exports.dispatchParentNotice = onCall(
  {
    region: "europe-west1",
    secrets: ["BREVO_API_KEY", "BREVO_SENDER_EMAIL", "BREVO_SENDER_NAME", "TERMII_API_KEY", "TERMII_SENDER_ID"],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in to send parent notices.");
    }

    const {
      studentId = null,
      studentName = "Student",
      guardianName = "",
      guardianContact = "",
      guardianEmail = "",
      subject = `ScholarQ Notice: ${studentName}`,
      message = "",
      channels = [],
    } = request.data || {};

    if (!message.trim()) {
      throw new HttpsError("invalid-argument", "Message body is required.");
    }
    if (channels.length === 0) {
      throw new HttpsError("invalid-argument", "Select at least one channel (SMS or Email).");
    }

    const results = {};

    if (channels.includes("sms")) {
      if (!guardianContact) {
        results.sms = { success: false, error: "No guardian phone number on file." };
      } else {
        try {
          await sendSms({ to: guardianContact, message });
          results.sms = { success: true };
        } catch (err) {
          results.sms = { success: false, error: err.message };
        }
      }
    }

    if (channels.includes("email")) {
      if (!guardianEmail) {
        results.email = { success: false, error: "No guardian email on file." };
      } else {
        try {
          const alreadyHasGreeting = /^dear\s/i.test(message.trim());
          const greeting = alreadyHasGreeting ? "" : `<p>Dear ${guardianName || "Guardian"},</p>`;
          await sendEmail({
            to: guardianEmail,
            toName: guardianName,
            subject,
            html: `<div style="font-family:sans-serif;line-height:1.5">${greeting}<p>${message.replace(/\n/g, "<br/>")}</p><p style="color:#666;font-size:12px;margin-top:24px">Sent via ScholarQ School Portal</p></div>`,
            text: message,
          });
          results.email = { success: true };
        } catch (err) {
          results.email = { success: false, error: err.message };
        }
      }
    }

    const anySuccess = Object.values(results).some((r) => r.success);

    await admin
      .firestore()
      .collection("parentNotifications")
      .add({
        studentId,
        studentName,
        guardianName,
        guardianContact,
        guardianEmail,
        subject,
        message,
        channels,
        results,
        sentBy: request.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return { success: anySuccess, results };
  }
);
