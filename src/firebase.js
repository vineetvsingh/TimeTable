import { initializeApp } from "firebase/app";
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

// Analytics isn't needed to use the app, so it is loaded separately after
// start-up. It throws where unsupported (e.g. cookies or IndexedDB blocked),
// so only initialise it when available.
import("firebase/analytics")
  .then(({ getAnalytics, isSupported }) =>
    isSupported().then((supported) => {
      if (supported) getAnalytics(app);
    })
  )
  .catch(() => {});

export { app, db, auth };