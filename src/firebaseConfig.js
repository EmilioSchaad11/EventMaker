// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcdQwwUVxQMsErdIjlIcZmPNpbbdgX_g0",
  authDomain: "gestor-de-eventos-a9df1.firebaseapp.com",
  projectId: "gestor-de-eventos-a9df1",
  storageBucket: "gestor-de-eventos-a9df1.firebasestorage.app",
  messagingSenderId: "806192054511",
  appId: "1:806192054511:web:0e35f3403bb4d9367edb1a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();