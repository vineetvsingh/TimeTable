import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA5My9rrC8WdXurddCOug6-rMOKiPw7F_U",
  authDomain: "time-table-generator-5c5a2.firebaseapp.com",
  projectId: "time-table-generator-5c5a2",
  storageBucket: "time-table-generator-5c5a2.firebasestorage.app",
  messagingSenderId: "1013597823425",
  appId: "1:1013597823425:web:5b348ad798e53cf17f8f40",
  measurementId: "G-GGM02HT77X"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

// Analytics throws in environments that don't support it (e.g. when cookies or
// IndexedDB are blocked), so only initialise it when available.
isSupported()
  .then((supported) => {
    if (supported) getAnalytics(app);
  })
  .catch(() => {});

export { app, db, auth };