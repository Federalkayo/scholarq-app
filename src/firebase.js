import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

export const firebaseConfig = {
  apiKey: "AIzaSyCCE98UtiFAWH6Jk0fkK8o9eA96dswlFvM",
  authDomain: "scholarq-cf796.firebaseapp.com",
  projectId: "scholarq-cf796",
  storageBucket: "scholarq-cf796.firebasestorage.app",
  messagingSenderId: "979849132863",
  appId: "1:979849132863:web:e668edccf77aaa4f88b18a",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "europe-west1");