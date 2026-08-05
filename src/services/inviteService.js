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
  runTransaction,
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
 * Redeem an invite code transactionally (used during Teacher signup)
 * Validates existence, single-use, non-expired status, and writes profile in 1 atomic transaction.
 */
export async function redeemInviteCode({ uid, email, name, code }) {
  if (!code || !uid || !email) {
    throw new Error('Code, UID, and Email are required for registration.');
  }

  const cleanCode = code.trim().toUpperCase();
  const inviteRef = doc(db, 'inviteCodes', cleanCode);
  const userRef = doc(db, 'users', uid);

  return await runTransaction(db, async (transaction) => {
    const inviteDoc = await transaction.get(inviteRef);

    if (!inviteDoc.exists()) {
      throw new Error('Invalid passcode. Please check the code provided by your administrator.');
    }

    const inviteData = inviteDoc.data();

    if (inviteData.used) {
      throw new Error('This passcode has already been used. Passcodes are single-use only.');
    }

    const now = Date.now();
    const expiresAt = typeof inviteData.expiresAt === 'number'
      ? inviteData.expiresAt
      : (inviteData.expiresAt?.toMillis ? inviteData.expiresAt.toMillis() : Number.MAX_SAFE_INTEGER);

    if (expiresAt < now) {
      throw new Error('This passcode has expired. Passcodes are valid for 24-72 hours.');
    }

    const userProfile = {
      uid,
      email,
      name: name || email.split('@')[0],
      role: inviteData.role || 'teacher',
      schoolId: inviteData.schoolId || 'sch_main',
      assignedClasses: inviteData.assignedClasses || ['Class 10A'],
      createdAt: new Date().toISOString()
    };

    // 1. Create user profile doc with assigned role & schoolId
    transaction.set(userRef, userProfile);

    // 2. Mark invite code as used
    transaction.update(inviteRef, {
      used: true,
      usedBy: uid,
      usedByEmail: email,
      usedAt: new Date().toISOString()
    });

    return userProfile;
  });
}
