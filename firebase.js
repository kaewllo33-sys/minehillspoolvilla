import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBlMb7iA8URXJUy0i5ydF-AoWJpa6mZn1g",
  authDomain: "minehills-poolvilla.firebaseapp.com",
  projectId: "minehills-poolvilla",
  storageBucket: "minehills-poolvilla.firebasestorage.app",
  messagingSenderId: "441759805705",
  appId: "1:441759805705:web:aac9ef1fa53f453923e3d8",
  measurementId: "G-DV7G6CHN25"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
