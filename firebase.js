// =========================================================
// EL PATRÓN DE LAS OFERTAS
// FIREBASE.JS
// Firebase centralizado para todo el proyecto
// =========================================================
import {
  initializeApp
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
// =========================================================
// CONFIGURACIÓN FIREBASE
// =========================================================
//
// IMPORTANTE:
// Reemplaza únicamente estos valores con los de tu proyecto.
//
// Firebase Console
// → Configuración del proyecto
// → Tus aplicaciones
// → Configuración del SDK
// =========================================================
const firebaseConfig = {
  apiKey:
    "REEMPLAZAR_API_KEY",
  authDomain:
    "REEMPLAZAR.firebaseapp.com",
  projectId:
    "REEMPLAZAR_PROJECT_ID",
  storageBucket:
    "REEMPLAZAR.appspot.com",
  messagingSenderId:
    "REEMPLAZAR_MESSAGING_SENDER_ID",
  appId:
    "REEMPLAZAR_APP_ID"
};
// =========================================================
// INICIALIZAR FIREBASE
// =========================================================
const app =
  initializeApp(firebaseConfig);
// =========================================================
// SERVICIOS
// =========================================================
const auth =
  getAuth(app);
const db =
  getFirestore(app);
const storage =
  getStorage(app);
// =========================================================
// EXPORTAR
// =========================================================
export {
  app,
  auth,
  db,
  storage
};