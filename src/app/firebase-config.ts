import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../environments/environment';

// Initialisiere die Firebase-App mit der Konfiguration aus environment.ts
const app = initializeApp(firebaseConfig);

// Exportiere die Authentifizierungs- und Firestore-Instanzen
export const auth = getAuth(app);
export const db = getFirestore(app);