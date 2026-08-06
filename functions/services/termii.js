const TERMII_API_URL = "https://v4.api.termii.com/api/sms/send";

/**
 * Normalizes a Nigerian-style local number (0801...) to international
 * format (234801...) which Termii expects. Leaves already-international
 * numbers untouched.
 */
function normalizePhone(phone) {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

/**
 * Sends an SMS via Termii.
 * Requires functions secret/config TERMII_API_KEY and TERMII_SENDER_ID
 * (a registered Sender ID, e.g. "ScholarQ" — must be approved in the
 * Termii dashboard before it will deliver).
 * Docs: https://developers.termii.com/messaging
 */
async function sendSms({ to, message }) {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || "ScholarQ";

  if (!apiKey) {
    throw new Error("TERMII_API_KEY is not configured. Run: firebase functions:secrets:set TERMII_API_KEY");
  }
  if (!to) {
    throw new Error("Recipient phone number is required to send via Termii.");
  }

  const res = await fetch(TERMII_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: normalizePhone(to),
      from: senderId,
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: apiKey,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.code === "ojoi_error" || data.message === "Bad Request") {
    throw new Error(`Termii SMS failed (${res.status}): ${data.message || JSON.stringify(data)}`);
  }

  return { success: true, messageId: data.message_id || null, balance: data.balance };
}

module.exports = { sendSms, normalizePhone };
