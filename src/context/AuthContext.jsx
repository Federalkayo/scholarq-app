import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // { role, email, schoolId, assignedClasses }
  const [loading, setLoading] = useState(true);

  // While true, an invite-code signup (createUserWithEmailAndPassword ->
  // redeemInviteCode) is actively in flight. onAuthStateChanged fires the
  // instant the auth account is created, which is BEFORE redeemInviteCode's
  // transaction has written the real profile — without this guard,
  // fetchProfile's fallback below would race it and could overwrite the
  // correct role with the 'admin' default, since Firestore writes here
  // aren't ordered against the Cloud Function's transaction.
  const signupInProgressRef = useRef(false);

  const fetchProfile = useCallback(async (user) => {
    if (!user) return;
    try {
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      if (profileSnap.exists()) {
        setUserProfile(profileSnap.data());
      } else {
        // No profile doc exists for this account. This should only happen
        // for an account that was never provisioned through the invite
        // system (e.g. created directly in the Firebase console). Rather
        // than silently defaulting to admin — which is what allowed the
        // earlier privilege-escalation bug — leave userProfile unset so
        // routing treats this as "no access" until an admin provisions
        // the account properly.
        console.error(`No profile document found for uid ${user.uid}. This account needs to be provisioned via an invite code or manually in Firestore.`);
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        if (signupInProgressRef.current) {
          // signupWithInviteCode owns profile creation for this user right
          // now via redeemInviteCode; skip the fallback so it can't race.
          setLoading(false);
          return;
        }
        await fetchProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [fetchProfile]);

  const signupWithInviteCode = async (email, password, name, code) => {
    signupInProgressRef.current = true;
    try {
      // 1. Create Firebase auth user client-side
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        // 2. Transactionally redeem passcode & create user profile document.
        // This runs server-side via the Admin SDK (functions/index.js),
        // which is what lets it bypass Firestore rules to create the
        // profile — a client-side write here could never be made both
        // functional and safe, since role is a privileged field.
        const redeem = httpsCallable(functions, 'redeemInviteCode');
        const result = await redeem({ uid: user.uid, email: user.email, name, code });
        const profile = result.data.profile;
        setCurrentUser(user);
        setUserProfile(profile);
        return profile;
      } catch (err) {
        // Rollback auth user creation if code redemption fails
        await user.delete();
        throw err;
      }
    } finally {
      signupInProgressRef.current = false;
    }
  };

  const logout = () => signOut(auth);

  const value = {
    currentUser,
    userProfile,
    loading,
    logout,
    signupWithInviteCode,
    refreshProfile: () => currentUser && fetchProfile(currentUser)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}