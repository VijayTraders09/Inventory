// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, doc, updateDoc } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYE55hlFlArrON8Ocner15ItagwZADBb4",
  authDomain: "vj-traders.firebaseapp.com",
  projectId: "vj-traders",
  storageBucket: "vj-traders.firebasestorage.app",
  messagingSenderId: "1093604666307",
  appId: "1:1093604666307:web:e328ac5132e7ba56ca6b76",
  measurementId: "G-N3KNHRJ2RC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db, collection, addDoc, doc, updateDoc };
