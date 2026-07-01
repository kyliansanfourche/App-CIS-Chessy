import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeAuth, getAuth, getReactNativePersistence, connectAuthEmulator, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// --- CONFIGURATION FIREBASE ---
// Ces valeurs identifient le projet Firebase mais ne sont pas des secrets : elles finissent de
// toute façon dans le bundle JS livré à l'utilisateur, et l'accès aux données est protégé par
// les règles de sécurité Firestore (voir firestore.rules), pas par leur confidentialité.
// Elles viennent des variables d'environnement (voir .env.example) pour éviter de les figer en
// dur dans l'historique Git et faciliter le changement de projet Firebase (dev/prod).
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Configuration Firebase manquante. Copiez .env.example vers .env et renseignez vos identifiants Firebase.'
  );
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// L'auth Réact Native a besoin d'AsyncStorage pour persister la session entre les
// lancements de l'app (sinon un nouvel utilisateur anonyme serait recréé à chaque démarrage).
export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

// Pour développer/tester en local sans toucher aux données de production, lancez
// `firebase emulators:start` puis démarrez l'app avec EXPO_PUBLIC_USE_FIREBASE_EMULATOR=1.
if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === '1') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

// Toute l'app (y compris les comptes existants créés avant cette mise à jour) passe par une
// authentification Firebase anonyme. Ça ne remplace pas le système d'identifiant/mot de passe
// métier stocké dans Firestore, mais ça permet de restreindre l'accès à la base de données
// aux seuls clients de l'app via des règles de sécurité (voir firestore.rules), au lieu de la
// laisser ouverte à n'importe qui connaissant la configuration Firebase publique.
export function ensureAnonymousAuth() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        if (user) {
          resolve(user);
          return;
        }
        signInAnonymously(auth).then((cred) => resolve(cred.user)).catch(reject);
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}
