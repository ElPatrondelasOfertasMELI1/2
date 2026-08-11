// =========================================================
// AUTH.JS
// Inicio de sesión
// =========================================================
import {
  auth,
  db
} from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const form =
  document.getElementById(
    "loginForm"
  );
const button =
  document.getElementById(
    "loginButton"
  );
const message =
  document.getElementById(
    "authMessage"
  );
// =========================================================
// SI YA ESTÁ LOGUEADO
// =========================================================
onAuthStateChanged(
  auth,
  user => {
    if (!user) {
      return;
    }
    // Evita enviar de nuevo al login.
    // El usuario ya tiene sesión.
    console.log(
      "Usuario conectado:",
      user.uid
    );
  }
);
// =========================================================
// LOGIN
// =========================================================
form?.addEventListener(
  "submit",
  async event => {
    event.preventDefault();
    const email =
      document
        .getElementById(
          "loginEmail"
        )
        .value
        .trim();
    const password =
      document
        .getElementById(
          "loginPassword"
        )
        .value;
    mostrarMensaje(
      "",
      ""
    );
    button.disabled =
      true;
    button.textContent =
      "⏳ ENTRANDO...";
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      mostrarMensaje(
        "✅ Sesión iniciada correctamente.",
        "success"
      );
      setTimeout(
        () => {
          window.location.href =
            "./perfil.html";
        },
        500
      );
    } catch (error) {
      console.error(
        error
      );
      mostrarMensaje(
        obtenerMensajeError(
          error
        ),
        "error"
      );
      button.disabled =
        false;
      button.textContent =
        "🔐 INICIAR SESIÓN";
    }
  }
);
// =========================================================
// MOSTRAR / OCULTAR PASSWORD
// =========================================================
document
  .querySelectorAll(
    ".password-toggle"
  )
  .forEach(
    toggle => {
      toggle.addEventListener(
        "click",
        () => {
          const targetId =
            toggle.dataset.passwordTarget;
          const input =
            document.getElementById(
              targetId
            );
          if (!input) {
            return;
          }
          if (
            input.type ===
            "password"
          ) {
            input.type =
              "text";
            toggle.textContent =
              "🙈";
          } else {
            input.type =
              "password";
            toggle.textContent =
              "👁️";
          }
        }
      );
    }
  );
// =========================================================
// MENSAJES
// =========================================================
function mostrarMensaje(
  texto,
  tipo
) {
  if (!message) {
    return;
  }
  message.textContent =
    texto;
  message.className =
    "auth-message";
  if (tipo) {
    message.classList.add(
      tipo
    );
  }
}
// =========================================================
// ERRORES FIREBASE
// =========================================================
function obtenerMensajeError(
  error
) {
  switch (
    error?.code
  ) {
    case "auth/invalid-email":
      return "❌ El correo electrónico no es válido.";
    case "auth/user-not-found":
      return "❌ No existe una cuenta con ese correo.";
    case "auth/wrong-password":
      return "❌ La contraseña es incorrecta.";
    case "auth/invalid-credential":
      return "❌ Correo o contraseña incorrectos.";
    case "auth/user-disabled":
      return "❌ Esta cuenta ha sido desactivada.";
    case "auth/too-many-requests":
      return "⏳ Demasiados intentos. Inténtalo más tarde.";
    case "auth/network-request-failed":
      return "📡 Revisa tu conexión a Internet.";
    default:
      return "❌ No fue posible iniciar sesión.";
  }
}