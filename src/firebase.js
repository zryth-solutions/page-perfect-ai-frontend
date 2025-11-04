import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDGKbBTG2_yYCnFAeX2TLiO6Bgs3m9xh1k",
  authDomain: "pageperfectai.firebaseapp.com",
  projectId: "pageperfectai",
  storageBucket: "pageperfectai.firebasestorage.app",
  messagingSenderId: "270919752365",
  appId: "1:270919752365:web:0dd5b8ab53aaa85300c424",
  measurementId: "G-LJY1W35SXH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };

