/* =========================================================
   ⚡ EL PATRÓN DE LAS OFERTAS
   ADMIN PRO JS
   Archivo: admin-pro.js
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   FIREBASE
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyDOoYZZhaTn6hbBQ0ml--mq8ByT0KdF9e0",
  authDomain: "el-patron-de-las-ofertas.firebaseapp.com",
  projectId: "el-patron-de-las-ofertas",
  storageBucket: "el-patron-de-las-ofertas.firebasestorage.app",
  messagingSenderId: "996329026447",
  appId: "1:996329026447:web:46eba80378d58de587d1fa",
  measurementId: "G-1LYNHBZVDM"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   ESTADO GLOBAL
   ========================================================= */

let usuarioActual = null;
let ofertaEditando = null;
let cuponEditando = null;


/* =========================================================
   UTILIDADES
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function mostrar(id) {
  const elemento = $(id);

  if (elemento) {
    elemento.style.display = "";
  }
}

function ocultar(id) {
  const elemento = $(id);

  if (elemento) {
    elemento.style.display = "none";
  }
}

function textoSeguro(valor) {
  if (valor === undefined || valor === null) {
    return "";
  }

  return String(valor);
}

function numero(valor) {
  const n = Number(valor);

  return Number.isFinite(n) ? n : 0;
}

function dinero(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(numero(valor));
}

function fechaFirebase(timestamp) {

  if (!timestamp) {
    return "Sin fecha";
  }

  try {

    const fecha = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

    return fecha.toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short"
    });

  } catch {
    return "Sin fecha";
  }
}

function escaparHTML(texto) {

  return textoSeguro(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function notificacion(mensaje, tipo = "success") {

  let caja = $("admin-notificacion");

  if (!caja) {

    caja = document.createElement("div");

    caja.id = "admin-notificacion";

    caja.style.position = "fixed";
    caja.style.top = "20px";
    caja.style.right = "20px";
    caja.style.zIndex = "99999";
    caja.style.padding = "14px 18px";
    caja.style.borderRadius = "12px";
    caja.style.fontWeight = "700";
    caja.style.boxShadow = "0 8px 30px rgba(0,0,0,.18)";
    caja.style.maxWidth = "360px";

    document.body.appendChild(caja);
  }

  caja.textContent = mensaje;

  if (tipo === "error") {
    caja.style.background = "#dc2626";
    caja.style.color = "#fff";
  } else {
    caja.style.background = "#16a34a";
    caja.style.color = "#fff";
  }

  clearTimeout(caja._timer);

  caja._timer = setTimeout(() => {
    caja.remove();
  }, 3500);
}


/* =========================================================
   AUTENTICACIÓN
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

  usuarioActual = user;

  if (user) {

    console.log("Administrador conectado:", user.email);

    mostrar("admin-panel");
    ocultar("login-panel");

    const emailElement = $("admin-email");

    if (emailElement) {
      emailElement.textContent = user.email;
    }

    await cargarDashboard();
    await cargarOfertas();
    await cargarCupones();

  } else {

    console.log("No hay administrador conectado.");

    ocultar("admin-panel");
    mostrar("login-panel");
  }
});


/* =========================================================
   LOGIN
   ========================================================= */

async function iniciarSesion() {

  const email = $("login-email")?.value.trim();
  const password = $("login-password")?.value;

  if (!email || !password) {

    notificacion(
      "Escribe tu correo y contraseña.",
      "error"
    );

    return;
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    notificacion("Sesión iniciada correctamente.");

  } catch (error) {

    console.error(error);

    let mensaje = "No se pudo iniciar sesión.";

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      mensaje = "Correo o contraseña incorrectos.";
    }

    if (error.code === "auth/too-many-requests") {
      mensaje = "Demasiados intentos. Espera un momento.";
    }

    notificacion(mensaje, "error");
  }
}

window.iniciarSesion = iniciarSesion;


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

async function cerrarSesion() {

  try {

    await signOut(auth);

    notificacion("Sesión cerrada.");

  } catch (error) {

    console.error(error);

    notificacion(
      "No se pudo cerrar la sesión.",
      "error"
    );
  }
}

window.cerrarSesion = cerrarSesion;


/* =========================================================
   OFERTAS
   ========================================================= */

async function guardarOferta() {

  if (!usuarioActual) {
    notificacion("Debes iniciar sesión.", "error");
    return;
  }

  const titulo = $("oferta-titulo")?.value.trim();
  const precioAntes = numero($("oferta-precio-antes")?.value);
  const precioActual = numero($("oferta-precio-actual")?.value);
  const imagen = $("oferta-imagen")?.value.trim();
  const link = $("oferta-link")?.value.trim();
  const categoria = $("oferta-categoria")?.value.trim();
  const tipo = $("oferta-tipo")?.value.trim();

  if (!titulo) {
    notificacion("Escribe el título de la oferta.", "error");
    return;
  }

  if (!precioActual) {
    notificacion("Escribe el precio actual.", "error");
    return;
  }

  if (!link) {
    notificacion("Agrega el enlace de Mercado Libre.", "error");
    return;
  }

  const datos = {

    titulo,

    precioAntes,

    precioActual,

    ahorro:
      precioAntes > precioActual
        ? precioAntes - precioActual
        : 0,

    imagen,

    link,

    categoria,

    tipo,

    actualizadoPor:
      usuarioActual.email,

    actualizadoEn:
      serverTimestamp()
  };


  try {

    if (ofertaEditando) {

      await updateDoc(
        doc(db, "ofertas", ofertaEditando),
        datos
      );

      notificacion(
        "Oferta actualizada correctamente."
      );

    } else {

      await addDoc(
        collection(db, "ofertas"),
        {
          ...datos,
          creadoEn: serverTimestamp()
        }
      );

      notificacion(
        "Oferta publicada correctamente."
      );
    }

    limpiarFormularioOferta();

    await cargarOfertas();
    await cargarDashboard();

  } catch (error) {

    console.error(error);

    notificacion(
      "Error al guardar la oferta: " + error.message,
      "error"
    );
  }
}

window.guardarOferta = guardarOferta;


/* =========================================================
   CARGAR OFERTAS
   ========================================================= */

async function cargarOfertas() {

  const contenedor =
    $("lista-ofertas") ||
    $("ofertas-lista");

  if (!contenedor) {
    return;
  }

  try {

    const consulta = query(
      collection(db, "ofertas"),
      orderBy("creadoEn", "desc")
    );

    const snapshot = await getDocs(consulta);

    if (snapshot.empty) {

      contenedor.innerHTML =
        `<div class="admin-empty">
          No hay ofertas publicadas.
        </div>`;

      actualizarContador("total-ofertas", 0);

      return;
    }

    let html = "";

    snapshot.forEach((item) => {

      const oferta = item.data();

      html += `
        <div class="admin-item">

          <div class="admin-item-image">

            ${
              oferta.imagen
                ? `<img
                    src="${escaparHTML(oferta.imagen)}"
                    alt=""
                    onerror="this.style.display='none'"
                  >`
                : "🛒"
            }

          </div>

          <div class="admin-item-info">

            <strong>
              ${escaparHTML(oferta.titulo)}
            </strong>

            <div>
              ${dinero(oferta.precioActual)}
            </div>

            ${
              oferta.precioAntes
                ? `<small>
                    Antes:
                    ${dinero(oferta.precioAntes)}
                  </small>`
                : ""
            }

          </div>

          <div class="admin-item-actions">

            <button
              onclick="editarOferta('${item.id}')"
            >
              ✏️
            </button>

            <button
              onclick="eliminarOferta('${item.id}')"
            >
              🗑️
            </button>

          </div>

        </div>
      `;
    });

    contenedor.innerHTML = html;

    actualizarContador(
      "total-ofertas",
      snapshot.size
    );

  } catch (error) {

    console.error(error);

    contenedor.innerHTML =
      `<div class="admin-error">
        No se pudieron cargar las ofertas.
      </div>`;
  }
}

window.cargarOfertas = cargarOfertas;


/* =========================================================
   EDITAR OFERTA
   ========================================================= */

async function editarOferta(id) {

  try {

    const referencia =
      doc(db, "ofertas", id);

    const snapshot =
      await getDoc(referencia);

    if (!snapshot.exists()) {
      notificacion(
        "La oferta ya no existe.",
        "error"
      );
      return;
    }

    const oferta = snapshot.data();

    ofertaEditando = id;

    asignarValor(
      "oferta-titulo",
      oferta.titulo
    );

    asignarValor(
      "oferta-precio-antes",
      oferta.precioAntes
    );

    asignarValor(
      "oferta-precio-actual",
      oferta.precioActual
    );

    asignarValor(
      "oferta-imagen",
      oferta.imagen
    );

    asignarValor(
      "oferta-link",
      oferta.link
    );

    asignarValor(
      "oferta-categoria",
      oferta.categoria
    );

    asignarValor(
      "oferta-tipo",
      oferta.tipo
    );

    const boton =
      $("btn-guardar-oferta");

    if (boton) {
      boton.textContent =
        "💾 ACTUALIZAR OFERTA";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (error) {

    console.error(error);

    notificacion(
      "No se pudo editar la oferta.",
      "error"
    );
  }
}

window.editarOferta = editarOferta;


/* =========================================================
   ELIMINAR OFERTA
   ========================================================= */

async function eliminarOferta(id) {

  if (!confirm(
    "¿Seguro que quieres eliminar esta oferta?"
  )) {
    return;
  }

  try {

    await deleteDoc(
      doc(db, "ofertas", id)
    );

    notificacion(
      "Oferta eliminada correctamente."
    );

    await cargarOfertas();
    await cargarDashboard();

  } catch (error) {

    console.error(error);

    notificacion(
      "No se pudo eliminar la oferta.",
      "error"
    );
  }
}

window.eliminarOferta = eliminarOferta;


/* =========================================================
   CUPONES
   ========================================================= */

async function guardarCupon() {

  if (!usuarioActual) {
    notificacion(
      "Debes iniciar sesión.",
      "error"
    );
    return;
  }

  const nombre =
    $("cupon-nombre")?.value.trim();

  const codigo =
    $("cupon-codigo")?.value.trim();

  const descuento =
    $("cupon-descuento")?.value.trim();

  const minimo =
    numero($("cupon-minimo")?.value);

  const tope =
    numero($("cupon-tope")?.value);

  const link =
    $("cupon-link")?.value.trim();

  const tipo =
    $("cupon-tipo")?.value.trim();

  const estado =
    $("cupon-estado")?.value || "activo";

  if (!nombre) {

    notificacion(
      "Escribe el nombre del cupón.",
      "error"
    );

    return;
  }

  if (!codigo) {

    notificacion(
      "Escribe el código del cupón.",
      "error"
    );

    return;
  }

  const datos = {

    nombre,

    codigo,

    descuento,

    minimo,

    tope,

    link,

    tipo,

    estado,

    actualizadoPor:
      usuarioActual.email,

    actualizadoEn:
      serverTimestamp()
  };


  try {

    if (cuponEditando) {

      await updateDoc(
        doc(db, "cupones", cuponEditando),
        datos
      );

      notificacion(
        "Cupón actualizado correctamente."
      );

    } else {

      await addDoc(
        collection(db, "cupones"),
        {
          ...datos,
          copias: 0,
          creadoEn: serverTimestamp()
        }
      );

      notificacion(
        "Cupón publicado correctamente."
      );
    }

    limpiarFormularioCupon();

    await cargarCupones();
    await cargarDashboard();

  } catch (error) {

    console.error(error);

    notificacion(
      "Error al guardar cupón: " +
      error.message,
      "error"
    );
  }
}

window.guardarCupon = guardarCupon;


/* =========================================================
   CARGAR CUPONES
   ========================================================= */

async function cargarCupones() {

  const contenedor =
    $("lista-cupones") ||
    $("cupones-lista");

  if (!contenedor) {
    return;
  }

  try {

    const consulta = query(
      collection(db, "cupones"),
      orderBy("creadoEn", "desc")
    );

    const snapshot =
      await getDocs(consulta);

    if (snapshot.empty) {

      contenedor.innerHTML =
        `<div class="admin-empty">
          No hay cupones publicados.
        </div>`;

      actualizarContador(
        "total-cupones",
        0
      );

      return;
    }

    let html = "";

    snapshot.forEach((item) => {

      const cupon = item.data();

      const estado =
        cupon.estado || "activo";

      html += `
        <div class="admin-item">

          <div class="admin-coupon-icon">
            🎟️
          </div>

          <div class="admin-item-info">

            <strong>
              ${escaparHTML(cupon.nombre)}
            </strong>

            <div>
              Código:
              <b>
                ${escaparHTML(cupon.codigo)}
              </b>
            </div>

            <small>
              ${escaparHTML(cupon.descuento || "")}
              ${
                cupon.minimo
                  ? ` · Mín. ${dinero(cupon.minimo)}`
                  : ""
              }
            </small>

            <span class="estado-${estado}">
              ${estado.toUpperCase()}
            </span>

          </div>

          <div class="admin-item-actions">

            <button
              onclick="editarCupon('${item.id}')"
            >
              ✏️
            </button>

            <button
              onclick="eliminarCupon('${item.id}')"
            >
              🗑️
            </button>

          </div>

        </div>
      `;
    });

    contenedor.innerHTML = html;

    actualizarContador(
      "total-cupones",
      snapshot.size
    );

  } catch (error) {

    console.error(error);

    contenedor.innerHTML =
      `<div class="admin-error">
        No se pudieron cargar los cupones.
      </div>`;
  }
}

window.cargarCupones = cargarCupones;


/* =========================================================
   EDITAR CUPÓN
   ========================================================= */

async function editarCupon(id) {

  try {

    const referencia =
      doc(db, "cupones", id);

    const snapshot =
      await getDoc(referencia);

    if (!snapshot.exists()) {

      notificacion(
        "El cupón ya no existe.",
        "error"
      );

      return;
    }

    const cupon =
      snapshot.data();

    cuponEditando = id;

    asignarValor(
      "cupon-nombre",
      cupon.nombre
    );

    asignarValor(
      "cupon-codigo",
      cupon.codigo
    );

    asignarValor(
      "cupon-descuento",
      cupon.descuento
    );

    asignarValor(
      "cupon-minimo",
      cupon.minimo
    );

    asignarValor(
      "cupon-tope",
      cupon.tope
    );

    asignarValor(
      "cupon-link",
      cupon.link
    );

    asignarValor(
      "cupon-tipo",
      cupon.tipo
    );

    asignarValor(
      "cupon-estado",
      cupon.estado
    );

    const boton =
      $("btn-guardar-cupon");

    if (boton) {
      boton.textContent =
        "💾 ACTUALIZAR CUPÓN";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (error) {

    console.error(error);

    notificacion(
      "No se pudo editar el cupón.",
      "error"
    );
  }
}

window.editarCupon = editarCupon;


/* =========================================================
   ELIMINAR CUPÓN
   ========================================================= */

async function eliminarCupon(id) {

  if (!confirm(
    "¿Seguro que quieres eliminar este cupón?"
  )) {
    return;
  }

  try {

    await deleteDoc(
      doc(db, "cupones", id)
    );

    notificacion(
      "Cupón eliminado correctamente."
    );

    await cargarCupones();
    await cargarDashboard();

  } catch (error) {

    console.error(error);

    notificacion(
      "No se pudo eliminar el cupón.",
      "error"
    );
  }
}

window.eliminarCupon = eliminarCupon;


/* =========================================================
   DASHBOARD
   ========================================================= */

async function cargarDashboard() {

  try {

    const [
      ofertas,
      cupones,
      copias,
      visitas
    ] = await Promise.all([

      getDocs(
        collection(db, "ofertas")
      ),

      getDocs(
        collection(db, "cupones")
      ),

      getDocs(
        collection(db, "copias")
      ),

      getDocs(
        collection(db, "visitas")
      )

    ]);


    actualizarContador(
      "total-ofertas",
      ofertas.size
    );

    actualizarContador(
      "total-cupones",
      cupones.size
    );

    actualizarContador(
      "total-copias",
      copias.size
    );

    actualizarContador(
      "total-visitas",
      visitas.size
    );


    /* -----------------------------------------
       CUPÓN MÁS COPIADO
       ----------------------------------------- */

    const contadorCupones = {};

    copias.forEach((item) => {

      const data = item.data();

      const codigo =
        data.codigo ||
        data.cupon ||
        data.cuponId ||
        "Desconocido";

      contadorCupones[codigo] =
        (contadorCupones[codigo] || 0) + 1;
    });

    let topCupon = "—";
    let maxCopias = 0;

    Object.entries(contadorCupones)
      .forEach(([codigo, cantidad]) => {

        if (cantidad > maxCopias) {

          maxCopias = cantidad;
          topCupon = codigo;
        }

      });

    const topCuponElement =
      $("top-cupon");

    if (topCuponElement) {

      topCuponElement.textContent =
        maxCopias > 0
          ? `${topCupon} (${maxCopias})`
          : "—";
    }


    /* -----------------------------------------
       TOP OFERTA
       ----------------------------------------- */

    const ofertaClicks = {};

    visitas.forEach((item) => {

      const data = item.data();

      const titulo =
        data.titulo ||
        data.oferta ||
        data.ofertaId;

      if (!titulo) {
        return;
      }

      ofertaClicks[titulo] =
        (ofertaClicks[titulo] || 0) + 1;
    });

    let topOferta = "—";
    let maxClicks = 0;

    Object.entries(ofertaClicks)
      .forEach(([titulo, cantidad]) => {

        if (cantidad > maxClicks) {

          maxClicks = cantidad;
          topOferta = titulo;
        }

      });

    const topOfertaElement =
      $("top-oferta");

    if (topOfertaElement) {

      topOfertaElement.textContent =
        maxClicks > 0
          ? topOferta
          : "—";
    }

  } catch (error) {

    console.error(
      "Error cargando dashboard:",
      error
    );
  }
}

window.cargarDashboard = cargarDashboard;


/* =========================================================
   CONTADORES
   ========================================================= */

function actualizarContador(id, valor) {

  const elemento = $(id);

  if (elemento) {
    elemento.textContent =
      Number(valor).toLocaleString("es-MX");
  }
}


/* =========================================================
   FORMULARIOS
   ========================================================= */

function asignarValor(id, valor) {

  const elemento = $(id);

  if (elemento) {
    elemento.value =
      valor === undefined ||
      valor === null
        ? ""
        : valor;
  }
}


function limpiarFormularioOferta() {

  ofertaEditando = null;

  [
    "oferta-titulo",
    "oferta-precio-antes",
    "oferta-precio-actual",
    "oferta-imagen",
    "oferta-link",
    "oferta-categoria",
    "oferta-tipo"
  ].forEach((id) => {

    const elemento = $(id);

    if (elemento) {
      elemento.value = "";
    }

  });

  const boton =
    $("btn-guardar-oferta");

  if (boton) {
    boton.textContent =
      "🚀 PUBLICAR OFERTA";
  }
}

window.limpiarFormularioOferta =
  limpiarFormularioOferta;


function limpiarFormularioCupon() {

  cuponEditando = null;

  [
    "cupon-nombre",
    "cupon-codigo",
    "cupon-descuento",
    "cupon-minimo",
    "cupon-tope",
    "cupon-link",
    "cupon-tipo"
  ].forEach((id) => {

    const elemento = $(id);

    if (elemento) {
      elemento.value = "";
    }

  });

  const estado =
    $("cupon-estado");

  if (estado) {
    estado.value = "activo";
  }

  const boton =
    $("btn-guardar-cupon");

  if (boton) {
    boton.textContent =
      "🎟️ PUBLICAR CUPÓN";
  }
}

window.limpiarFormularioCupon =
  limpiarFormularioCupon;


/* =========================================================
   CALCULAR AHORRO
   ========================================================= */

function calcularAhorroOferta() {

  const antes =
    numero(
      $("oferta-precio-antes")?.value
    );

  const actual =
    numero(
      $("oferta-precio-actual")?.value
    );

  const ahorro =
    antes > actual
      ? antes - actual
      : 0;

  const porcentaje =
    antes > 0
      ? Math.round(
          (ahorro / antes) * 100
        )
      : 0;

  const ahorroElement =
    $("oferta-ahorro");

  if (ahorroElement) {

    ahorroElement.textContent =
      ahorro > 0
        ? `${dinero(ahorro)} · ${porcentaje}%`
        : "—";
  }

  return {
    ahorro,
    porcentaje
  };
}

window.calcularAhorroOferta =
  calcularAhorroOferta;


/* =========================================================
   EVENTOS
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const precioAntes =
      $("oferta-precio-antes");

    const precioActual =
      $("oferta-precio-actual");

    if (precioAntes) {
      precioAntes.addEventListener(
        "input",
        calcularAhorroOferta
      );
    }

    if (precioActual) {
      precioActual.addEventListener(
        "input",
        calcularAhorroOferta
      );
    }

    const loginForm =
      $("login-form");

    if (loginForm) {

      loginForm.addEventListener(
        "submit",
        (event) => {

          event.preventDefault();

          iniciarSesion();
        }
      );
    }


    const logoutButton =
      $("btn-logout");

    if (logoutButton) {

      logoutButton.addEventListener(
        "click",
        cerrarSesion
      );
    }


    const ofertaForm =
      $("oferta-form");

    if (ofertaForm) {

      ofertaForm.addEventListener(
        "submit",
        (event) => {

          event.preventDefault();

          guardarOferta();
        }
      );
    }


    const cuponForm =
      $("cupon-form");

    if (cuponForm) {

      cuponForm.addEventListener(
        "submit",
        (event) => {

          event.preventDefault();

          guardarCupon();
        }
      );
    }

  }
);


/* =========================================================
   EXPONER FUNCIONES
   ========================================================= */

window.adminFirebase = {
  app,
  auth,
  db
};

console.log(
  "⚡ Admin PRO Firebase cargado correctamente."
);