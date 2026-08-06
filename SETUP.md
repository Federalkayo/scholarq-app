# ScholarQ Notifications — Setup Guide

This adds three notification channels to ScholarQ:

1. **Browser push (Firebase Cloud Messaging)** — real OS-level push + an
   in-app "Claude-style" toast popup for admin/teacher staff.
2. **Brevo** — transactional email to parents/guardians.
3. **Termii** — SMS to parents/guardians (Nigerian numbers auto-normalized).

Triggers wired up: fee due/overdue (daily 7am job), attendance marked
Absent (instant), school announcements (instant + optional parent
broadcast), and the "Smart Parent Communication" modal (manual, on demand).

## 1. Install dependencies

```bash
npm install
cd functions && npm install && cd ..
```

## 2. Get your API keys

- **Brevo**: dashboard.brevo.com → SMTP & API → API Keys → create a key.
  Also verify a sender email/domain (Senders, Domains & Dedicated IPs).
- **Termii**: termii.com dashboard → API Keys. You'll also need a
  registered **Sender ID** (e.g. "ScholarQ") approved for your account —
  unapproved sender IDs will silently fail to deliver.
- **Firebase Web Push (VAPID) key**: Firebase Console → Project Settings
  → Cloud Messaging tab → "Web configuration" → Web Push certificates →
  Generate key pair.

## 3. Configure Cloud Functions secrets

```bash
firebase functions:secrets:set BREVO_API_KEY
firebase functions:secrets:set BREVO_SENDER_EMAIL   # e.g. no-reply@yourschool.com
firebase functions:secrets:set BREVO_SENDER_NAME    # e.g. "ScholarQ School Portal"
firebase functions:secrets:set TERMII_API_KEY
firebase functions:secrets:set TERMII_SENDER_ID     # e.g. ScholarQ
```

Each function that needs them already declares
`runWith({ secrets: [...] })`, so once you `firebase deploy`, they'll be
injected into `process.env` automatically — no extra wiring needed.

## 4. Frontend env var

Create `.env` at the project root:

```
VITE_FIREBASE_VAPID_KEY=your-vapid-public-key-here
```

## 5. Deploy

```bash
firebase deploy --only firestore:rules,functions,hosting
```

## 6. Try it

- Log in as admin/teacher → click the bell icon → "Enable push" → accept
  the browser permission prompt.
- Mark a student "Absent" on the Attendance page → within a few seconds
  you should see a Claude-style toast pop up top-right, plus (if the
  student has a guardianContact/guardianEmail) an SMS/email goes out.
- Open a student → "AI Contact Guardian" → generate a message → tick
  SMS/Email → "Dispatch Notice" for a manual, on-demand send.
- The daily fee reminder job runs automatically at 7am Africa/Lagos —
  you can test it early via `firebase functions:shell` and calling
  `dailyFeeReminders()`.

## Notes / things to harden before production

- `firestore.rules` for most collections are currently wide open
  (`allow read, write: if true`) — that predates this change, but it's
  worth locking down `students`, `fees`, and `attendance` to
  authenticated staff only while you're in here.
- `getStaffUids()` currently fetches *all* users and filters client-side;
  fine for a single-school app, but add a Firestore index/query if you
  scale to many staff.
- Termii's Sender ID approval and Brevo's sender domain verification can
  each take a day or two — request them early.
