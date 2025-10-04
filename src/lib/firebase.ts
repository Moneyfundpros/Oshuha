import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAXEBhtbjmdBLTxdBUs-RhVrW0N23nyPpE",
  authDomain: "cyber-deception.firebaseapp.com",
  projectId: "cyber-deception",
  storageBucket: "cyber-deception.firebasestorage.app",
  messagingSenderId: "169840559734",
  appId: "1:169840559734:web:cd33183b77369382bcc157"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
