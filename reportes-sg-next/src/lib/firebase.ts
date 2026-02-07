import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCVC2q-4l_sPRUcPvM68HyFFvrTD0pqgDQ",
    authDomain: "credenciales-sg.firebaseapp.com",
    projectId: "credenciales-sg",
    storageBucket: "credenciales-sg.firebasestorage.app",
    messagingSenderId: "837758546349",
    appId: "1:837758546349:web:a389a2ce37a12f0294b124",
    measurementId: "G-FFRXZ7CT4F"
};

// Inicializar solo si no existe ya (para evitar errores en hot reload o SSR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, db };
