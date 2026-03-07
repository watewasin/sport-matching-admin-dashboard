// ══════════════════════════════════════════════════════════════
//  Firebase Configuration
//  → Go to Firebase Console → Project Settings → Your Apps
//  → Copy the firebaseConfig object and paste it below
// ══════════════════════════════════════════════════════════════

const firebaseConfig = {
    apiKey: "AIzaSyDXJX52IkUUGz8RFgGHeotS_tUz1lcafvI",
    authDomain: "techstars-db.firebaseapp.com",
    projectId: "techstars-db",
    storageBucket: "techstars-db.firebasestorage.app",
    messagingSenderId: "1019616132756",
    appId: "1:1019616132756:web:67437285979f429b70877c",
    measurementId: "G-QLSX4FC26E"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore instance — used throughout app.js as window.db
window.db = firebase.firestore();
