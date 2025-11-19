import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCV6ZLKS_IqlUdIcetr2lKGfjqQSyrLzQo",
    authDomain: "butcele-8c387.firebaseapp.com",
    projectId: "butcele-8c387",
    storageBucket: "butcele-8c387.firebasestorage.app",
    messagingSenderId: "115103166439",
    appId: "1:115103166439:web:62fee13de99c8a171a5742"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
