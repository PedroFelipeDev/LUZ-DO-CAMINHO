
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// TODO: Replace with your actual Firebase project configuration
// You can find these in the Firebase Console -> Project Settings
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "luz-do-caminho-ai.firebaseapp.com",
    projectId: "luz-do-caminho-ai",
    storageBucket: "luz-do-caminho-ai.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

import { getAnalytics } from "firebase/analytics";
import { getPerformance } from "firebase/performance";

// ... (config)

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const analytics = getAnalytics(app);
export const performance = getPerformance(app);

export default app;
