// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAQ4sTdy1dC4IyMJFC9Yz3bVEBSEU_sbHI",
    authDomain: "messaging-website-8cee3.firebaseapp.com",
    databaseURL: "https://messaging-website-8cee3-default-rtdb.firebaseio.com",
    projectId: "messaging-website-8cee3",
    storageBucket: "messaging-website-8cee3.firebasestorage.app",
    messagingSenderId: "1017918066104",
    appId: "1:1017918066104:web:823f87c4b2c3d4929ed34d",
    measurementId: "G-Q07MV0TB0H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Export the functions and variables needed by other scripts
export { auth, provider, signInWithPopup, onAuthStateChanged, signOut };
