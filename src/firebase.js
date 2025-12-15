import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDZOf5Lz6ZCvzSJhsYW2ncJUeCzBIVyynA",
  authDomain: "to-do-app-aa8dc.firebaseapp.com",
  projectId: "to-do-app-aa8dc",
  storageBucket: "to-do-app-aa8dc.firebasestorage.app",
  messagingSenderId: "352263445376",
  appId: "1:352263445376:web:a86cd6a07e0ba8c5173f65",
  measurementId: "G-ZHN69KR6PR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

