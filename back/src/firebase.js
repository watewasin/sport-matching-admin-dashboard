import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// These are the credentials from your Firebase Console (Web App Config)
const firebaseConfig = {
  apiKey: "AIzaSyDXJX52IkUUGz8RFgGHeotS_tUz1lcafvI",
  authDomain: "techstars-db.firebaseapp.com",
  projectId: "techstars-db",
  storageBucket: "techstars-db.firebasestorage.app",
  messagingSenderId: "673853861235",
  appId: "1:673853861235:web:92cd9bd7fb13088c816906",
  measurementId: "G-QLSX4FC26E"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);