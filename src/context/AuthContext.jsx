import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { redeemInviteCode } from '../services/inviteService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // { role, email, schoolId, assignedClasses }
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user) => {
    try {
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      if (profileSnap.exists()) {
        setUserProfile(profileSnap.data());
      } else {
        // Fallback default for existing demo/admin account
        setUserProfile({
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'Principal Admin',
          role: 'admin',
          schoolId: 'sch_main',
          assignedClasses: ['Class 10A', 'Class 10B', 'Class 11A', 'Class 11B', 'Class 12A']
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUserProfile({
        uid: user.uid,
        email: user.email,
        name: user.email?.split('@')[0] || 'Principal Admin',
        role: 'admin',
        schoolId: 'sch_main',
        assignedClasses: ['Class 10A', 'Class 10B', 'Class 11A', 'Class 11B', 'Class 12A']
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signupWithInviteCode = async (email, password, name, code) => {
    // 1. Create Firebase auth user client-side
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    try {
      // 2. Transactionally redeem passcode & create user profile document server-side
      const profile = await redeemInviteCode({
        uid: user.uid,
        email: user.email,
        name,
        code
      });
      setUserProfile(profile);
      return profile;
    } catch (err) {
      // Rollback auth user creation if code redemption fails
      await user.delete();
      throw err;
    }
  };

  const logout = () => signOut(auth);

  const value = { currentUser, userProfile, loading, logout, signupWithInviteCode, refreshProfile: () => currentUser && fetchProfile(currentUser) };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}