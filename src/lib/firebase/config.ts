import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBaA7KcEfchQBh3vyu09HaKbgSKPhT629U",
  authDomain: "easymarketingautomation.firebaseapp.com",
  projectId: "easymarketingautomation",
  storageBucket: "easymarketingautomation.firebasestorage.app",
  messagingSenderId: "348263426054",
  appId: "1:348263426054:web:2da1f67300d44f0e157b87",
};

// Initialize Firebase for the client side only
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
}

export { app, auth }; 