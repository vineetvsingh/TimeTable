import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBNB8q9w7qRIVcfV4VegZCm6zZg-lwDCJI",
  authDomain: "timetable-d00d1.firebaseapp.com",
  projectId: "timetable-d00d1",
  storageBucket: "timetable-d00d1.firebasestorage.app",
  messagingSenderId: "838806829080",
  appId: "1:838806829080:web:94acf6f5472c4b2f3fab6d",
  measurementId: "G-7KJW120LK2"
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