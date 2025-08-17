import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

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

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Export the Google Auth provider
export const googleProvider = new GoogleAuthProvider();
