import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
getAuth
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ==================================
   CONFIGURA TUS DATOS DE FIREBASE
================================== */

const firebaseConfig = {

apiKey: "TU_API_KEY",

authDomain:
"TU_PROYECTO.firebaseapp.com",

projectId:
"TU_PROYECTO",

storageBucket:
"TU_PROYECTO.appspot.com",

messagingSenderId:
"123456789",

appId:
"1:123456789:web:abcdef123456"

};

/* ==================================
   INICIALIZAR
================================== */

const app =
initializeApp(firebaseConfig);

const db =
getFirestore(app);

const auth =
getAuth(app);

/* ==================================
   EXPORTAR
================================== */

export {
app,
db,
auth
};