import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Find these values in your Firebase Console: 
// Project Settings > General > Your Apps > Config
const firebaseConfig = {
  apiKey: "AIzaSyDGPkSeVodRLqoAJa0wyNzTw-Iv_xLiD2k",
  authDomain: "foodie-b27aa.firebaseapp.com",
  projectId: "foodie-b27aa",
  storageBucket: "foodie-b27aa.firebasestorage.app",
  messagingSenderId: "514108159286",
  appId: "1:514108159286:web:2ddfa93aa00a134a546f97",
  measurementId: "G-VY8D3HT18H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();