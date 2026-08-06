import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { redeemInviteCode } from '../services/inviteService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // { role, email, schoolId, assignedClasses }
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user) => {
    if (!user) return;
    try {
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      if (profileSnap.exists()) {
        setUserProfile(profileSnap.data());
      } else {
        const defaultProfile = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'Principal Admin',
          role: 'admin',
          schoolId: 'sch_main',
          assignedClasses: ['Class 10A', 'Class 10B', 'Class 11A', 'Class 11B', 'Class 12A']
        };
        await setDoc(doc(db, 'users', user.uid), defaultProfile).catch(() => {});
        setUserProfile(defaultProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      const fallback = {
        uid: user.uid,
        email: user.email,
        name: user.email?.split('@')[0] || 'Principal Admin',
        role: 'admin',
        schoolId: 'sch_main',
        assignedClasses: ['Class 10A', 'Class 10B', 'Class 11A', 'Class 11B', 'Class 12A']
      };
      setUserProfile(fallback);
    }
  }, []);

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
  }, [fetchProfile]);

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