const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Sends a transactional email via Brevo.
 * Requires functions secret/config BREVO_API_KEY.
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 */
async function sendEmail({ to, toName, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "no-reply@scholarq.app";
  const senderName = process.env.BREVO_SENDER_NAME || "ScholarQ School Portal";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured. Run: firebase functions:secrets:set BREVO_API_KEY");
  }
  if (!to) {
    throw new Error("Recipient email is required to send via Brevo.");
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to, name: toName || undefined }],
      subject,
      htmlContent: html || `<p>${text}</p>`,
      textContent: text || undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(`Brevo email failed (${res.status}): ${data.message || JSON.stringify(data)}`);
  }

  return { success: true, messageId: data.messageId };
}

module.exports = { sendEmail };
