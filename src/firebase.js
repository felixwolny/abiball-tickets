import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA4Q3yx3lKFuahPoLUpz3hQEyMHLoZVIj4",
  authDomain: "abiball-f7fde.firebaseapp.com",
  projectId: "abiball-f7fde",
  storageBucket: "abiball-f7fde.firebasestorage.app",
  messagingSenderId: "284355289912",
  appId: "1:284355289912:web:9199279835f668562e57cd",
  measurementId: "G-RWNNB84Z4N",
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
