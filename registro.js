// =========================================================
// REGISTRO.JS
// Crear usuarios
// =========================================================
import {
  auth,
  db
} from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  updateProfile
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const form =
  document.getElementById(
    "registerForm"
  );
const button =
  document.getElementById(
    "registerButton"
  );
const message =
  document.getElementById(
    "authMessage"
  );
// =========================================================
// REGISTRO
// =========================================================
form?.addEventListener(
  "submit",
  async event => {
    event.preventDefault();
    const nombre =
      document
        .getElementById(
          "registerName"
        )
        .value
        .trim();
    const email =
      document
        .getElementById(
          "registerEmail"
        )
        .value
        .trim()
        .toLowerCase();
    const telefono =
      document
        .getElementById(
          "registerPhone"
        )
        .value
        .trim();
    const estado =
      document
        .getElementById(
          "registerState"
        )
        .value;
    const password =
      document
        .getElementById(
          "registerPassword"
        )
        .value;
    const passwordConfirm =
      document
        .getElementById(
          "registerPasswordConfirm"
        )
        .value;
    const accepted =
      document
        .getElementById(
          "acceptTerms"
        )
        .checked;
    mostrarMensaje(
      "",
      ""
    );
    // -----------------------------------------------------
    // VALIDACIONES
    // -----------------------------------------------------
    if (
      nombre.length <
      2
    ) {
      mostrarMensaje(
        "❌ Escribe tu nombre.",
        "error"
      );
      return;
    }
    const telefonoLimpio =
      telefono.replace(
        /\D/g,
        ""
      );
    if (
      telefonoLimpio.length !==
      10
    ) {
      mostrarMensaje(
        "❌ El teléfono debe tener 10 dígitos.",
        "error"
      );
      return;
    }
    if (
      password.length <
      6
    ) {
      mostrarMensaje(
        "❌ La contraseña debe tener al menos 6 caracteres.",
        "error"
      );
      return;
    }
    if (
      password !==
      passwordConfirm
    ) {
      mostrarMensaje(
        "❌ Las contraseñas no coinciden.",
        "error"
      );
      return;
    }
    if (!accepted) {
      mostrarMensaje(
        "❌ Debes aceptar las condiciones para continuar.",
        "error"
      );
      return;
    }
    button.disabled =
      true;
    button.textContent =
      "⏳ CREANDO CUENTA...";
    try {
      // ---------------------------------------------------
      // FIREBASE AUTH
      // ---------------------------------------------------
      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      const user =
        credential.user;
      // ---------------------------------------------------
      // NOMBRE EN AUTH
      // ---------------------------------------------------
      await updateProfile(
        user,
        {
          displayName:
            nombre
        }
      );
      // ---------------------------------------------------
      // PERFIL FIRESTORE
      // ---------------------------------------------------
      await setDoc(
        doc(
          db,
          "usuarios",
          user.uid
        ),
        {
          uid:
            user.uid,
          nombre,
          email,
          telefono:
            telefonoLimpio,
          estado,
          foto:
            "",
          ahorroTotal:
            0,
          compras:
            0,
          cuponesUsados:
            0,
          visitas:
            0,
          rol:
            "usuario",
          activo:
            true,
          verificado:
            false,
          creado:
            serverTimestamp(),
          actualizado:
            serverTimestamp()
        }
      );
      // ---------------------------------------------------
      // ESTADÍSTICA ESTADO
      // ---------------------------------------------------
      await setDoc(
        doc(
          db,
          "regiones",
          estado
        ),
        {
          estado,
          usuarios:
            1,
          actualizado:
            serverTimestamp()
        },
        {
          merge: true
        }
      );
      mostrarMensaje(
        "✅ Cuenta creada correctamente. ¡Bienvenido!",
        "success"
      );
      setTimeout(
        () => {
          window.location.href =
            "./perfil.html";
        },
        900
      );
    } catch (error) {
      console.error(
        "Error registro:",
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
        "🚀 CREAR MI CUENTA";
    }
  }
);
// =========================================================
// PASSWORD
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
          const target =
            document.getElementById(
              toggle.dataset.passwordTarget
            );
          if (!target) {
            return;
          }
          if (
            target.type ===
            "password"
          ) {
            target.type =
              "text";
            toggle.textContent =
              "🙈";
          } else {
            target.type =
              "password";
            toggle.textContent =
              "👁️";
          }
        }
      );
    }
  );
// =========================================================
// MENSAJE
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
// ERRORES
// =========================================================
function obtenerMensajeError(
  error
) {
  switch (
    error?.code
  ) {
    case "auth/email-already-in-use":
      return "❌ Este correo ya tiene una cuenta.";
    case "auth/invalid-email":
      return "❌ El correo electrónico no es válido.";
    case "auth/weak-password":
      return "❌ La contraseña es demasiado débil.";
    case "auth/network-request-failed":
      return "📡 Revisa tu conexión a Internet.";
    case "auth/operation-not-allowed":
      return "⚙️ Debes activar Email/Password en Firebase Authentication.";
    default:
      return "❌ No fue posible crear la cuenta.";
  }
}