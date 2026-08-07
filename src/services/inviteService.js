import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Generate a random 6-character alphanumeric passcode formatted as TCH-XXXXXX
 */
export function generatePasscode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TCH-${result}`;
}

/**
 * Create a new invite code (Admin only)
 */
export async function createInviteCode({
  role = 'teacher',
  hoursValid = 48,
  assignedClasses = ['Class 10A'],
  createdBy = 'admin'
}) {
  const code = generatePasscode();
  const cleanCode = code.toUpperCase();
  const expiresAtMillis = Date.now() + parseInt(hoursValid, 10) * 3600 * 1000;

  const inviteData = {
    code: cleanCode,
    role,
    schoolId: 'sch_main',
    createdBy,
    createdAt: serverTimestamp(),
    expiresAt: expiresAtMillis,
    used: false,
    assignedClasses: Array.isArray(assignedClasses) ? assignedClasses : [assignedClasses]
  };

  await setDoc(doc(db, 'inviteCodes', cleanCode), inviteData);
  return { ...inviteData, code: cleanCode };
}

/**
 * Fetch all invite codes for Admin Settings view
 */
export async function getInviteCodes() {
  try {
    let querySnapshot;
    try {
      const q = query(collection(db, 'inviteCodes'), orderBy('createdAt', 'desc'));
      querySnapshot = await getDocs(q);
    } catch (err) {
      // Fallback if index on createdAt is missing
      querySnapshot = await getDocs(collection(db, 'inviteCodes'));
    }

    const codes = [];
    querySnapshot.forEach((docSnap) => {
      codes.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort in memory by createdAt descending
    return codes.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (typeof a.createdAt === 'number' ? a.createdAt : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (typeof b.createdAt === 'number' ? b.createdAt : 0);
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error fetching invite codes:', error);
    return [];
  }
}

/**
 * NOTE: invite-code redemption during signup is handled by the
 * redeemInviteCode Cloud Function (see functions/index.js), called from
 * AuthContext.jsx via httpsCallable — not from this file. A client-side
 * version used to live here, but it required Firestore rules to allow
 * direct client writes to the `role` field on `users/{uid}`, which made
 * it possible for anyone to self-register as admin by calling this
 * function directly from the browser console, bypassing invite codes
 * entirely. Redeeming server-side via the Admin SDK closes that hole.
 */
