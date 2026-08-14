/* =========================================================
   ⚡ EL PATRÓN DE LAS OFERTAS
   ADMIN PRO
   Firebase + Firestore + Authentication
   Compatible con admin-pro.html actual
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
   ESTADO
========================================================= */

let usuarioActual = null;

let ofertas = [];
let cupones = [];
let usuarios = [];
let copias = [];
let visitas = [];

let ofertaEditando = null;
let cuponEditando = null;


/* =========================================================
   UTILIDADES
========================================================= */

const $ = (id) => document.getElementById(id);

function texto(valor) {
  if (valor === undefined || valor === null) return "";
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

function escaparHTML(valor) {
  return texto(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fecha(valor) {
  if (!valor) return "Sin fecha";

  try {
    const d = valor?.toDate
      ? valor.toDate()
      : new Date(valor);

    if (Number.isNaN(d.getTime())) {
      return "Sin fecha";
    }

    return d.toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short"
    });

  } catch {
    return "Sin fecha";
  }
}


/* =========================================================
   TOAST
========================================================= */

function toast(mensaje, tipo = "success") {

  const caja = $("toast");

  if (!caja) {
    console.log(mensaje);
    return;
  }

  const icono = $("toastIcon");
  const textoToast = $("toastMessage");

  if (textoToast) {
    textoToast.textContent = mensaje;
  }

  if (icono) {
    icono.textContent =
      tipo === "error" ? "❌" :
      tipo === "warning" ? "⚠️" :
      "✅";
  }

  caja.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    caja.classList.remove("show");
  }, 3500);
}


/* =========================================================
   LOADING
========================================================= */

function ocultarCarga() {

  const loading = $("loadingScreen");

  if (!loading) return;

  loading.style.display = "none";
}

function mostrarCarga() {

  const loading = $("loadingScreen");

  if (!loading) return;

  loading.style.display = "flex";
}


/* =========================================================
   LOGIN / AUTH
========================================================= */

async function iniciarSesion(event) {

  if (event) {
    event.preventDefault();
  }

  const email = $("loginEmail")?.value.trim();
  const password = $("loginPassword")?.value;

  const errorBox = $("loginError");

  if (errorBox) {
    errorBox.textContent = "";
    errorBox.style.display = "none";
  }

  if (!email || !password) {

    mostrarErrorLogin(
      "Escribe tu correo electrónico y contraseña."
    );

    return;
  }

  const boton = document.querySelector(
    "#loginForm button[type='submit']"
  );

  if (boton) {
    boton.disabled = true;
    boton.textContent = "⏳ ENTRANDO...";
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    toast("Sesión iniciada correctamente.");

  } catch (error) {

    console.error("Error login:", error);

    let mensaje = "No se pudo iniciar sesión.";

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      mensaje = "Correo o contraseña incorrectos.";
    }

    if (error.code === "auth/invalid-email") {
      mensaje = "El correo no es válido.";
    }

    if (error.code === "auth/too-many-requests") {
      mensaje =
        "Demasiados intentos. Espera unos minutos.";
    }

    mostrarErrorLogin(mensaje);

  } finally {

    if (boton) {
      boton.disabled = false;
      boton.textContent = "🔐 ENTRAR";
    }
  }
}


function mostrarErrorLogin(mensaje) {

  const errorBox = $("loginError");

  if (!errorBox) {
    toast(mensaje, "error");
    return;
  }

  errorBox.textContent = mensaje;
  errorBox.style.display = "block";
}


async function cerrarSesion() {

  try {

    await signOut(auth);

    toast("Sesión cerrada.");

  } catch (error) {

    console.error(error);

    toast(
      "No se pudo cerrar la sesión.",
      "error"
    );
  }
}


/* =========================================================
   MOSTRAR / OCULTAR PANELES
========================================================= */

function mostrarAdmin() {

  const login = $("loginScreen");
  const admin = $("adminApp");

  if (login) {
    login.style.display = "none";
  }

  if (admin) {
    admin.style.display = "";
  }
}

function mostrarLogin() {

  const login = $("loginScreen");
  const admin = $("adminApp");

  if (admin) {
    admin.style.display = "none";
  }

  if (login) {
    login.style.display = "flex";
  }
}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(auth, async (user) => {

  try {

    usuarioActual = user;

    ocultarCarga();

    if (user) {

      console.log(
        "Administrador conectado:",
        user.email
      );

      mostrarAdmin();

      const emailElement = $("adminEmail");

      if (emailElement) {
        emailElement.textContent = user.email || "";
      }

      actualizarConexion(true);

      await cargarTodo();

    } else {

      console.log(
        "No hay administrador conectado."
      );

      mostrarLogin();

      actualizarConexion(false);
    }

  } catch (error) {

    console.error(
      "Error inicializando Admin PRO:",
      error
    );

    ocultarCarga();

    mostrarLogin();

    actualizarConexion(false);

    toast(
      "Error conectando con Firebase.",
      "error"
    );
  }
});


/* =========================================================
   CONEXIÓN
========================================================= */

function actualizarConexion(conectado) {

  const dot = $("connectionDot");
  const text = $("connectionText");

  if (dot) {

    dot.classList.toggle(
      "online",
      conectado
    );

    dot.classList.toggle(
      "offline",
      !conectado
    );
  }

  if (text) {

    text.textContent = conectado
      ? "Firebase conectado"
      : "Firebase desconectado";
  }
}


/* =========================================================
   CARGAR TODO
========================================================= */

async function cargarTodo() {

  await Promise.allSettled([
    cargarOfertas(),
    cargarCupones(),
    cargarUsuarios(),
    cargarCopias(),
    cargarVisitas()
  ]);

  actualizarDashboard();
  cargarEstadisticas();
}


/* =========================================================
   OFERTAS
========================================================= */

async function cargarOfertas() {

  try {

    const snapshot = await getDocs(
      collection(db, "ofertas")
    );

    ofertas = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    ofertas.sort(
      (a, b) =>
        obtenerMillis(b.fechaCreacion) -
        obtenerMillis(a.fechaCreacion)
    );

    renderOfertas();

    renderOfertasRecientes();

    cargarCategorias();

  } catch (error) {

    console.error(
      "Error cargando ofertas:",
      error
    );

    ofertas = [];

    renderOfertas();

    const tabla = $("offersTable");

    if (tabla) {
      tabla.innerHTML = `
        <tr>
          <td colspan="6" class="table-loading">
            ❌ Error cargando ofertas
          </td>
        </tr>
      `;
    }
  }
}


function obtenerMillis(valor) {

  if (!valor) return 0;

  try {

    if (valor.toDate) {
      return valor.toDate().getTime();
    }

    const fecha = new Date(valor);

    return Number.isNaN(fecha.getTime())
      ? 0
      : fecha.getTime();

  } catch {
    return 0;
  }
}


function renderOfertas() {

  const tabla = $("offersTable");

  if (!tabla) return;

  const busqueda =
    $("offerSearch")?.value
      .trim()
      .toLowerCase() || "";

  const categoria =
    $("offerCategoryFilter")?.value || "";

  let lista = [...ofertas];

  if (busqueda) {

    lista = lista.filter(oferta => {

      return (
        texto(oferta.titulo)
          .toLowerCase()
          .includes(busqueda) ||

        texto(oferta.categoria)
          .toLowerCase()
          .includes(busqueda)
      );
    });
  }

  if (categoria) {

    lista = lista.filter(
      oferta =>
        texto(oferta.categoria) === categoria
    );
  }

  if (!lista.length) {

    tabla.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty">
          No hay ofertas.
        </td>
      </tr>
    `;

    return;
  }

  tabla.innerHTML = lista.map(oferta => {

    const precioAntes =
      numero(oferta.precioAntes);

    const precioActual =
      numero(
        oferta.precioActual ??
        oferta.precio
      );

    const clicks =
      numero(
        oferta.clics ??
        oferta.clicks
      );

    const imagen =
      texto(oferta.imagen);

    return `
      <tr>

        <td>
          <div class="table-product">

            ${
              imagen
                ? `<img
                    src="${escaparHTML(imagen)}"
                    alt=""
                    class="table-image"
                  >`
                : `<div class="table-image-placeholder">
                    🔥
                  </div>`
            }

            <div>
              <strong>
                ${escaparHTML(
                  oferta.titulo || "Sin título"
                )}
              </strong>

              <small>
                ${escaparHTML(
                  oferta.tipo || ""
                )}
              </small>
            </div>

          </div>
        </td>

        <td>
          ${
            precioAntes
              ? dinero(precioAntes)
              : "—"
          }
        </td>

        <td>
          <strong>
            ${dinero(precioActual)}
          </strong>
        </td>

        <td>
          ${escaparHTML(
            oferta.categoria || "Sin categoría"
          )}
        </td>

        <td>
          ${clicks.toLocaleString("es-MX")}
        </td>

        <td>

          <div class="table-actions">

            <button
              class="action-btn edit"
              data-edit-offer="${oferta.id}"
              title="Editar"
            >
              ✏️
            </button>

            <button
              class="action-btn delete"
              data-delete-offer="${oferta.id}"
              title="Eliminar"
            >
              🗑️
            </button>

          </div>

        </td>

      </tr>
    `;

  }).join("");
}


/* =========================================================
   CATEGORÍAS
========================================================= */

function cargarCategorias() {

  const select =
    $("offerCategoryFilter");

  if (!select) return;

  const actual = select.value;

  const categorias = [
    ...new Set(
      ofertas
        .map(o => texto(o.categoria).trim())
        .filter(Boolean)
    )
  ].sort();

  select.innerHTML = `
    <option value="">
      Todas las categorías
    </option>

    ${categorias.map(categoria => `
      <option value="${escaparHTML(categoria)}">
        ${escaparHTML(categoria)}
      </option>
    `).join("")}
  `;

  select.value = actual;
}


/* =========================================================
   OFERTAS RECIENTES
========================================================= */

function renderOfertasRecientes() {

  const contenedor =
    $("recentOffers");

  if (!contenedor) return;

  const lista =
    ofertas.slice(0, 5);

  if (!lista.length) {

    contenedor.innerHTML = `
      <div class="empty-state">
        No hay ofertas todavía.
      </div>
    `;

    return;
  }

  contenedor.innerHTML =
    lista.map(oferta => {

      return `
        <div class="recent-item">

          <div class="recent-icon">
            🔥
          </div>

          <div class="recent-info">

            <strong>
              ${escaparHTML(
                oferta.titulo || "Oferta"
              )}
            </strong>

            <small>
              ${dinero(
                oferta.precioActual ??
                oferta.precio ??
                0
              )}
            </small>

          </div>

        </div>
      `;

    }).join("");
}


/* =========================================================
   NUEVA OFERTA
========================================================= */

function abrirNuevaOferta() {

  ofertaEditando = null;

  limpiarFormularioOferta();

  const titulo =
    $("offerModalTitle");

  if (titulo) {
    titulo.textContent =
      "Nueva oferta";
  }

  abrirModal("offerModal");
}


/* =========================================================
   EDITAR OFERTA
========================================================= */

async function editarOferta(id) {

  const oferta =
    ofertas.find(o => o.id === id);

  if (!oferta) return;

  ofertaEditando = id;

  $("offerId").value = id;

  $("offerTitle").value =
    oferta.titulo || "";

  $("offerOldPrice").value =
    oferta.precioAntes ?? "";

  $("offerPrice").value =
    oferta.precioActual ??
    oferta.precio ??
    "";

  $("offerCategory").value =
    oferta.categoria || "";

  $("offerClicks").value =
    oferta.clics ??
    oferta.clicks ??
    0;

  $("offerLink").value =
    oferta.link || "";

  const preview =
    $("offerImagePreview");

  if (preview) {

    preview.innerHTML =
      oferta.imagen
        ? `<img src="${escaparHTML(
            oferta.imagen
          )}" alt="Vista previa">`
        : "";
  }

  const titulo =
    $("offerModalTitle");

  if (titulo) {
    titulo.textContent =
      "Editar oferta";
  }

  abrirModal("offerModal");
}


/* =========================================================
   GUARDAR OFERTA
========================================================= */

async function guardarOferta(event) {

  if (event) {
    event.preventDefault();
  }

  if (!usuarioActual) {

    toast(
      "Debes iniciar sesión.",
      "error"
    );

    return;
  }

  const titulo =
    $("offerTitle")?.value.trim();

  const precioAntes =
    numero(
      $("offerOldPrice")?.value
    );

  const precioActual =
    numero(
      $("offerPrice")?.value
    );

  const categoria =
    $("offerCategory")?.value.trim();

  const clicks =
    numero(
      $("offerClicks")?.value
    );

  const link =
    $("offerLink")?.value.trim();

  const archivo =
    $("offerImage")?.files?.[0];

  if (!titulo) {

    toast(
      "Escribe el título.",
      "error"
    );

    return;
  }

  if (!precioActual) {

    toast(
      "Escribe el precio actual.",
      "error"
    );

    return;
  }

  if (!link) {

    toast(
      "Escribe el link de Mercado Libre.",
      "error"
    );

    return;
  }

  const boton =
    document.querySelector(
      "#offerForm button[type='submit']"
    );

  if (boton) {
    boton.disabled = true;
    boton.textContent = "⏳ GUARDANDO...";
  }

  try {

    let imagen = "";

    if (ofertaEditando) {

      const existente =
        ofertas.find(
          o => o.id === ofertaEditando
        );

      imagen =
        existente?.imagen || "";
    }

    if (archivo) {

      imagen =
        await convertirImagenBase64(
          archivo
        );
    }

    const datos = {

      titulo,

      precioAntes,

      precioActual,

      categoria,

      clics: clicks,

      clicks,

      link,

      imagen,

      actualizadoPor:
        usuarioActual.email,

      actualizadoEn:
        serverTimestamp()
    };


    if (ofertaEditando) {

      await updateDoc(
        doc(
          db,
          "ofertas",
          ofertaEditando
        ),
        datos
      );

      toast(
        "Oferta actualizada correctamente."
      );

    } else {

      await addDoc(
        collection(db, "ofertas"),
        {
          ...datos,

          creadoPor:
            usuarioActual.email,

          fechaCreacion:
            serverTimestamp(),

          creadoEn:
            serverTimestamp()
        }
      );

      toast(
        "Oferta publicada correctamente."
      );
    }

    cerrarModal("offerModal");

    limpiarFormularioOferta();

    await cargarOfertas();

    actualizarDashboard();

  } catch (error) {

    console.error(
      "Error guardando oferta:",
      error
    );

    toast(
      "No se pudo guardar la oferta.",
      "error"
    );

  } finally {

    if (boton) {
      boton.disabled = false;
      boton.textContent =
        "💾 Guardar oferta";
    }
  }
}


/* =========================================================
   ELIMINAR OFERTA
========================================================= */

async function eliminarOferta(id) {

  if (!usuarioActual) return;

  const oferta =
    ofertas.find(o => o.id === id);

  const confirmar =
    confirm(
      `¿Eliminar la oferta "${oferta?.titulo || ""}"?`
    );

  if (!confirmar) return;

  try {

    await deleteDoc(
      doc(db, "ofertas", id)
    );

    toast(
      "Oferta eliminada correctamente."
    );

    await cargarOfertas();

    actualizarDashboard();

  } catch (error) {

    console.error(
      "Error eliminando oferta:",
      error
    );

    toast(
      "No se pudo eliminar la oferta.",
      "error"
    );
  }
}


/* =========================================================
   CUPONES
========================================================= */

async function cargarCupones() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "cupones")
      );

    cupones =
      snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

    cupones.sort(
      (a, b) =>
        obtenerMillis(b.fechaCreacion) -
        obtenerMillis(a.fechaCreacion)
    );

    renderCupones();

    renderTopCupones();

  } catch (error) {

    console.error(
      "Error cargando cupones:",
      error
    );

    cupones = [];

    renderCupones();
  }
}


function renderCupones() {

  const tabla =
    $("couponsTable");

  if (!tabla) return;

  const busqueda =
    $("couponSearch")?.value
      .trim()
      .toLowerCase() || "";

  const tipo =
    $("couponTypeFilter")?.value || "";

  let lista = [...cupones];

  if (busqueda) {

    lista =
      lista.filter(cupon => {

        return (
          texto(cupon.codigo)
            .toLowerCase()
            .includes(busqueda) ||

          texto(cupon.descripcion)
            .toLowerCase()
            .includes(busqueda)
        );

      });
  }

  if (tipo) {

    lista =
      lista.filter(
        cupon =>
          texto(cupon.tipo) === tipo
      );
  }

  if (!lista.length) {

    tabla.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty">
          No hay cupones.
        </td>
      </tr>
    `;

    return;
  }

  tabla.innerHTML =
    lista.map(cupon => {

      const copias =
        numero(
          cupon.copias ??
          cupon.copies
        );

      const estado =
        cupon.estado ||
        cupon.status ||
        "activo";

      const clase =
        estado === "agotado"
          ? "danger"
          : estado === "por-agotarse"
          ? "warning"
          : "success";

      return `
        <tr>

          <td>
            <strong>
              ${escaparHTML(
                cupon.codigo || "—"
              )}
            </strong>
          </td>

          <td>
            ${tipoCupon(
              cupon.tipo
            )}
          </td>

          <td>
            ${escaparHTML(
              cupon.descuento || "—"
            )}
          </td>

          <td>
            ${
              numero(cupon.minimo)
                ? dinero(cupon.minimo)
                : "—"
            }
          </td>

          <td>
            ${
              numero(cupon.tope)
                ? dinero(cupon.tope)
                : "—"
            }
          </td>

          <td>
            ${copias.toLocaleString("es-MX")}
          </td>

          <td>

            <span class="status-badge ${clase}">
              ${
                estado === "agotado"
                  ? "🔴 Agotado"
                  : estado === "por-agotarse"
                  ? "🟠 Por agotarse"
                  : "🟢 Activo"
              }
            </span>

            <div class="table-actions">

              <button
                class="action-btn edit"
                data-edit-coupon="${cupon.id}"
              >
                ✏️
              </button>

              <button
                class="action-btn delete"
                data-delete-coupon="${cupon.id}"
              >
                🗑️
              </button>

            </div>

          </td>

        </tr>
      `;

    }).join("");
}


function tipoCupon(tipo) {

  switch (tipo) {

    case "relampago":
      return "⚡ Relámpago";

    case "bancario":
      return "🏦 Bancario";

    case "meliplus":
      return "💛 Meli+";

    default:
      return escaparHTML(
        tipo || "Otro"
      );
  }
}


/* =========================================================
   NUEVO CUPÓN
========================================================= */

function abrirNuevoCupon() {

  cuponEditando = null;

  limpiarFormularioCupon();

  const titulo =
    $("couponModalTitle");

  if (titulo) {
    titulo.textContent =
      "Nuevo cupón";
  }

  abrirModal("couponModal");
}


/* =========================================================
   EDITAR CUPÓN
========================================================= */

function editarCupon(id) {

  const cupon =
    cupones.find(c => c.id === id);

  if (!cupon) return;

  cuponEditando = id;

  $("couponId").value = id;

  $("couponCode").value =
    cupon.codigo || "";

  $("couponType").value =
    cupon.tipo || "relampago";

  $("couponDiscount").value =
    cupon.descuento || "";

  $("couponMinimum").value =
    cupon.minimo ?? "";

  $("couponMaximum").value =
    cupon.tope ?? "";

  $("couponCopies").value =
    cupon.copias ??
    cupon.copies ??
    0;

  $("couponStatus").value =
    cupon.estado ||
    cupon.status ||
    "activo";

  $("couponDescription").value =
    cupon.descripcion || "";

  const titulo =
    $("couponModalTitle");

  if (titulo) {
    titulo.textContent =
      "Editar cupón";
  }

  abrirModal("couponModal");
}


/* =========================================================
   GUARDAR CUPÓN
========================================================= */

async function guardarCupon(event) {

  if (event) {
    event.preventDefault();
  }

  if (!usuarioActual) {

    toast(
      "Debes iniciar sesión.",
      "error"
    );

    return;
  }

  const codigo =
    $("couponCode")?.value.trim();

  const tipo =
    $("couponType")?.value;

  const descuento =
    $("couponDiscount")?.value.trim();

  const minimo =
    numero(
      $("couponMinimum")?.value
    );

  const tope =
    numero(
      $("couponMaximum")?.value
    );

  const copias =
    numero(
      $("couponCopies")?.value
    );

  const estado =
    $("couponStatus")?.value ||
    "activo";

  const descripcion =
    $("couponDescription")?.value.trim();

  if (!codigo) {

    toast(
      "Escribe el código del cupón.",
      "error"
    );

    return;
  }

  const boton =
    document.querySelector(
      "#couponForm button[type='submit']"
    );

  if (boton) {
    boton.disabled = true;
    boton.textContent = "⏳ GUARDANDO...";
  }

  try {

    const datos = {

      codigo,

      tipo,

      descuento,

      minimo,

      tope,

      copias,

      copies: copias,

      estado,

      status: estado,

      descripcion,

      actualizadoPor:
        usuarioActual.email,

      actualizadoEn:
        serverTimestamp()
    };


    if (cuponEditando) {

      await updateDoc(
        doc(
          db,
          "cupones",
          cuponEditando
        ),
        datos
      );

      toast(
        "Cupón actualizado correctamente."
      );

    } else {

      await addDoc(
        collection(db, "cupones"),
        {
          ...datos,

          creadoPor:
            usuarioActual.email,

          fechaCreacion:
            serverTimestamp(),

          creadoEn:
            serverTimestamp()
        }
      );

      toast(
        "Cupón publicado correctamente."
      );
    }

    cerrarModal("couponModal");

    limpiarFormularioCupon();

    await cargarCupones();

    actualizarDashboard();

  } catch (error) {

    console.error(
      "Error guardando cupón:",
      error
    );

    toast(
      "No se pudo guardar el cupón.",
      "error"
    );

  } finally {

    if (boton) {
      boton.disabled = false;
      boton.textContent =
        "💾 Guardar cupón";
    }
  }
}


/* =========================================================
   ELIMINAR CUPÓN
========================================================= */

async function eliminarCupon(id) {

  const cupon =
    cupones.find(c => c.id === id);

  const confirmar =
    confirm(
      `¿Eliminar el cupón "${cupon?.codigo || ""}"?`
    );

  if (!confirmar) return;

  try {

    await deleteDoc(
      doc(db, "cupones", id)
    );

    toast(
      "Cupón eliminado correctamente."
    );

    await cargarCupones();

    actualizarDashboard();

  } catch (error) {

    console.error(
      "Error eliminando cupón:",
      error
    );

    toast(
      "No se pudo eliminar el cupón.",
      "error"
    );
  }
}


/* =========================================================
   USUARIOS
========================================================= */

async function cargarUsuarios() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "usuarios")
      );

    usuarios =
      snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

    usuarios.sort(
      (a, b) =>
        obtenerMillis(b.fechaRegistro) -
        obtenerMillis(a.fechaRegistro)
    );

    renderUsuarios();

  } catch (error) {

    console.error(
      "Error cargando usuarios:",
      error
    );

    usuarios = [];

    renderUsuarios();
  }
}


function renderUsuarios() {

  const tabla =
    $("usersTable");

  if (!tabla) return;

  const busqueda =
    $("userSearch")?.value
      .trim()
      .toLowerCase() || "";

  let lista = [...usuarios];

  if (busqueda) {

    lista =
      lista.filter(usuario => {

        return (
          texto(usuario.nombre)
            .toLowerCase()
            .includes(busqueda) ||

          texto(usuario.email)
            .toLowerCase()
            .includes(busqueda)
        );
      });
  }

  if (!lista.length) {

    tabla.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty">
          No hay usuarios registrados.
        </td>
      </tr>
    `;

    return;
  }

  tabla.innerHTML =
    lista.map(usuario => {

      return `
        <tr>

          <td>
            <strong>
              ${escaparHTML(
                usuario.nombre ||
                "Sin nombre"
              )}
            </strong>
          </td>

          <td>
            ${escaparHTML(
              usuario.email || "—"
            )}
          </td>

          <td>
            <span class="status-badge success">
              🟢 Registrado
            </span>
          </td>

          <td>
            ${numero(
              usuario.visitas
            ).toLocaleString("es-MX")}
          </td>

          <td>
            ${numero(
              usuario.compras
            ).toLocaleString("es-MX")}
          </td>

          <td>
            ${dinero(
              usuario.ahorroTotal
            )}
          </td>

          <td>
            ${fecha(
              usuario.fechaRegistro ||
              usuario.creadoEn
            )}
          </td>

        </tr>
      `;

    }).join("");
}


/* =========================================================
   COPIAS
========================================================= */

async function cargarCopias() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "copias")
      );

    copias =
      snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

  } catch (error) {

    console.warn(
      "No se pudieron cargar copias:",
      error
    );

    copias = [];
  }
}


/* =========================================================
   VISITAS
========================================================= */

async function cargarVisitas() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "visitas")
      );

    visitas =
      snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

  } catch (error) {

    console.warn(
      "No se pudieron cargar visitas:",
      error
    );

    visitas = [];
  }
}


/* =========================================================
   DASHBOARD
========================================================= */

function actualizarDashboard() {

  const totalOfertas =
    $("totalOfertas");

  const totalCupones =
    $("totalCupones");

  const totalUsuarios =
    $("totalUsuarios");

  const totalClics =
    $("totalClics");

  const totalCompras =
    $("totalCompras");

  const ahorroTotal =
    $("ahorroTotal");


  if (totalOfertas) {
    totalOfertas.textContent =
      ofertas.length.toLocaleString("es-MX");
  }

  if (totalCupones) {
    totalCupones.textContent =
      cupones.length.toLocaleString("es-MX");
  }

  if (totalUsuarios) {
    totalUsuarios.textContent =
      usuarios.length.toLocaleString("es-MX");
  }


  const clics =
    ofertas.reduce(
      (total, oferta) =>
        total +
        numero(
          oferta.clics ??
          oferta.clicks
        ),
      0
    );

  if (totalClics) {
    totalClics.textContent =
      clics.toLocaleString("es-MX");
  }


  const compras =
    usuarios.reduce(
      (total, usuario) =>
        total +
        numero(usuario.compras),
      0
    );

  if (totalCompras) {
    totalCompras.textContent =
      compras.toLocaleString("es-MX");
  }


  const ahorro =
    usuarios.reduce(
      (total, usuario) =>
        total +
        numero(usuario.ahorroTotal),
      0
    );

  if (ahorroTotal) {
    ahorroTotal.textContent =
      dinero(ahorro);
  }


  renderOfertaPopular();
}


/* =========================================================
   OFERTA MÁS POPULAR
========================================================= */

function renderOfertaPopular() {

  const contenedor =
    $("topOffer");

  if (!contenedor) return;

  if (!ofertas.length) {

    contenedor.innerHTML = `
      <div class="empty-state">
        No hay ofertas.
      </div>
    `;

    return;
  }

  const oferta =
    [...ofertas].sort(
      (a, b) =>
        numero(
          b.clics ??
          b.clicks
        ) -
        numero(
          a.clics ??
          a.clicks
        )
    )[0];

  const clicks =
    numero(
      oferta.clics ??
      oferta.clicks
    );

  contenedor.innerHTML = `
    <div class="top-offer">

      ${
        oferta.imagen
          ? `<img
              src="${escaparHTML(
                oferta.imagen
              )}"
              alt=""
              class="top-offer-image"
            >`
          : `<div class="top-offer-image">
              🔥
            </div>`
      }

      <div class="top-offer-info">

        <h3>
          ${escaparHTML(
            oferta.titulo || "Oferta"
          )}
        </h3>

        <strong>
          ${dinero(
            oferta.precioActual ??
            oferta.precio ??
            0
          )}
        </strong>

        <span>
          👆 ${clicks.toLocaleString("es-MX")} clics
        </span>

      </div>

    </div>
  `;
}


/* =========================================================
   CUPONES MÁS USADOS
========================================================= */

function renderTopCupones() {

  const contenedor =
    $("topCoupons");

  if (!contenedor) return;

  const lista =
    [...cupones]
      .sort(
        (a, b) =>
          numero(
            b.copias ??
            b.copies
          ) -
          numero(
            a.copias ??
            a.copies
          )
      )
      .slice(0, 5);

  if (!lista.length) {

    contenedor.innerHTML = `
      <div class="empty-state">
        No hay cupones todavía.
      </div>
    `;

    return;
  }

  contenedor.innerHTML =
    lista.map(cupon => {

      return `
        <div class="recent-item">

          <div class="recent-icon">
            🎟️
          </div>

          <div class="recent-info">

            <strong>
              ${escaparHTML(
                cupon.codigo || "Cupón"
              )}
            </strong>

            <small>
              ${numero(
                cupon.copias ??
                cupon.copies
              ).toLocaleString("es-MX")}
              copias
            </small>

          </div>

        </div>
      `;

    }).join("");
}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

function cargarEstadisticas() {

  cargarClickStats();
  cargarCouponStats();
  cargarStateStats();
  cargarDailyStats();
}


function cargarClickStats() {

  const contenedor =
    $("clickStats");

  if (!contenedor) return;

  const lista =
    [...ofertas]
      .sort(
        (a, b) =>
          numero(
            b.clics ??
            b.clicks
          ) -
          numero(
            a.clics ??
            a.clicks
          )
      )
      .slice(0, 10);

  if (!lista.length) {

    contenedor.innerHTML =
      `<div class="empty-state">
        Sin datos todavía.
      </div>`;

    return;
  }

  contenedor.innerHTML =
    lista.map((oferta, index) => {

      return `
        <div class="stat-row">

          <span>
            ${index + 1}. 
            ${escaparHTML(
              oferta.titulo ||
              "Oferta"
            )}
          </span>

          <strong>
            ${numero(
              oferta.clics ??
              oferta.clicks
            ).toLocaleString("es-MX")}
          </strong>

        </div>
      `;

    }).join("");
}


function cargarCouponStats() {

  const contenedor =
    $("couponStats");

  if (!contenedor) return;

  const lista =
    [...cupones]
      .sort(
        (a, b) =>
          numero(
            b.copias ??
            b.copies
          ) -
          numero(
            a.copias ??
            a.copies
          )
      )
      .slice(0, 10);

  if (!lista.length) {

    contenedor.innerHTML =
      `<div class="empty-state">
        Sin datos todavía.
      </div>`;

    return;
  }

  contenedor.innerHTML =
    lista.map((cupon, index) => {

      return `
        <div class="stat-row">

          <span>
            ${index + 1}.
            ${escaparHTML(
              cupon.codigo ||
              "Cupón"
            )}
          </span>

          <strong>
            ${numero(
              cupon.copias ??
              cupon.copies
            ).toLocaleString("es-MX")}
          </strong>

        </div>
      `;

    }).join("");
}


function cargarStateStats() {

  const contenedor =
    $("stateStats");

  if (!contenedor) return;

  const estados = {};

  usuarios.forEach(usuario => {

    const estado =
      texto(
        usuario.estado ||
        usuario.state ||
        "Sin estado"
      ).trim();

    estados[estado] =
      (estados[estado] || 0) + 1;
  });

  const lista =
    Object.entries(estados)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

  if (!lista.length) {

    contenedor.innerHTML =
      `<div class="empty-state">
        Sin usuarios todavía.
      </div>`;

    return;
  }

  contenedor.innerHTML =
    lista.map(([estado, cantidad]) => {

      return `
        <div class="stat-row">

          <span>
            🇲🇽 ${escaparHTML(estado)}
          </span>

          <strong>
            ${cantidad.toLocaleString("es-MX")}
          </strong>

        </div>
      `;

    }).join("");
}


function cargarDailyStats() {

  const contenedor =
    $("dailyStats");

  if (!contenedor) return;

  const dias = {};

  [...visitas, ...copias].forEach(item => {

    const timestamp =
      item.fecha ||
      item.fechaCreacion ||
      item.creadoEn ||
      item.timestamp;

    const millis =
      obtenerMillis(timestamp);

    if (!millis) return;

    const d =
      new Date(millis);

    const clave =
      d.toLocaleDateString(
        "es-MX"
      );

    dias[clave] =
      (dias[clave] || 0) + 1;
  });

  const lista =
    Object.entries(dias)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

  if (!lista.length) {

    contenedor.innerHTML =
      `<div class="empty-state">
        Sin actividad registrada.
      </div>`;

    return;
  }

  contenedor.innerHTML =
    lista.map(([dia, cantidad]) => {

      return `
        <div class="stat-row">

          <span>
            📅 ${escaparHTML(dia)}
          </span>

          <strong>
            ${cantidad.toLocaleString("es-MX")}
          </strong>

        </div>
      `;

    }).join("");
}


/* =========================================================
   MODALES
========================================================= */

function abrirModal(id) {

  const modal = $(id);

  if (!modal) return;

  modal.style.display = "flex";

  document.body.classList.add(
    "modal-open"
  );
}


function cerrarModal(id) {

  const modal = $(id);

  if (!modal) return;

  modal.style.display = "none";

  document.body.classList.remove(
    "modal-open"
  );
}


/* =========================================================
   LIMPIAR FORMULARIO OFERTA
========================================================= */

function limpiarFormularioOferta() {

  ofertaEditando = null;

  const form =
    $("offerForm");

  if (form) {
    form.reset();
  }

  if ($("offerId")) {
    $("offerId").value = "";
  }

  if ($("offerClicks")) {
    $("offerClicks").value = 0;
  }

  const preview =
    $("offerImagePreview");

  if (preview) {
    preview.innerHTML = "";
  }

  const titulo =
    $("offerModalTitle");

  if (titulo) {
    titulo.textContent =
      "Nueva oferta";
  }
}


/* =========================================================
   LIMPIAR CUPÓN
========================================================= */

function limpiarFormularioCupon() {

  cuponEditando = null;

  const form =
    $("couponForm");

  if (form) {
    form.reset();
  }

  if ($("couponId")) {
    $("couponId").value = "";
  }

  if ($("couponCopies")) {
    $("couponCopies").value = 0;
  }

  if ($("couponStatus")) {
    $("couponStatus").value =
      "activo";
  }

  if ($("couponType")) {
    $("couponType").value =
      "relampago";
  }

  const titulo =
    $("couponModalTitle");

  if (titulo) {
    titulo.textContent =
      "Nuevo cupón";
  }
}


/* =========================================================
   IMAGEN A BASE64
========================================================= */

function convertirImagenBase64(archivo) {

  return new Promise(
    (resolve, reject) => {

      const lector =
        new FileReader();

      lector.onload = () =>
        resolve(
          lector.result
        );

      lector.onerror = reject;

      lector.readAsDataURL(
        archivo
      );
    }
  );
}


/* =========================================================
   VISTA PREVIA DE IMAGEN
========================================================= */

function vistaPreviaImagen(event) {

  const archivo =
    event.target.files?.[0];

  const preview =
    $("offerImagePreview");

  if (!preview) return;

  if (!archivo) {

    preview.innerHTML = "";

    return;
  }

  const url =
    URL.createObjectURL(
      archivo
    );

  preview.innerHTML = `
    <img
      src="${url}"
      alt="Vista previa"
    >
  `;
}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function cambiarSeccion(seccion) {

  document
    .querySelectorAll(
      ".admin-section"
    )
    .forEach(elemento => {

      elemento.classList.toggle(
        "active",
        elemento.id ===
          `section-${seccion}`
      );
    });


  document
    .querySelectorAll(
      ".menu-item"
    )
    .forEach(boton => {

      boton.classList.toggle(
        "active",
        boton.dataset.section ===
          seccion
      );
    });


  const titulos = {

    dashboard: [
      "Dashboard",
      "Resumen general de tu página"
    ],

    ofertas: [
      "Ofertas",
      "Administra tus ofertas"
    ],

    cupones: [
      "Cupones",
      "Administra tus cupones"
    ],

    usuarios: [
      "Usuarios",
      "Usuarios registrados"
    ],

    estadisticas: [
      "Estadísticas",
      "Analiza el rendimiento"
    ],

    configuracion: [
      "Configuración",
      "Configuración general"
    ]
  };

  const info =
    titulos[seccion] ||
    titulos.dashboard;

  if ($("pageTitle")) {
    $("pageTitle").textContent =
      info[0];
  }

  if ($("pageSubtitle")) {
    $("pageSubtitle").textContent =
      info[1];
  }


  const sidebar =
    $("sidebar");

  if (
    sidebar &&
    window.innerWidth <= 900
  ) {
    sidebar.classList.remove(
      "open"
    );
  }


  if (seccion === "estadisticas") {
    cargarEstadisticas();
  }
}


/* =========================================================
   EVENTOS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /* LOGIN */

    const loginForm =
      $("loginForm");

    if (loginForm) {

      loginForm.addEventListener(
        "submit",
        iniciarSesion
      );
    }


    /* PASSWORD */

    const togglePassword =
      $("togglePassword");

    if (togglePassword) {

      togglePassword.addEventListener(
        "click",
        () => {

          const input =
            $("loginPassword");

          if (!input) return;

          if (
            input.type === "password"
          ) {

            input.type = "text";

            togglePassword.textContent =
              "🙈";

          } else {

            input.type = "password";

            togglePassword.textContent =
              "👁️";
          }
        }
      );
    }


    /* LOGOUT */

    const logout =
      $("logoutBtn");

    if (logout) {

      logout.addEventListener(
        "click",
        cerrarSesion
      );
    }


    /* NUEVA OFERTA */

    const newOffer =
      $("newOfferBtn");

    if (newOffer) {

      newOffer.addEventListener(
        "click",
        abrirNuevaOferta
      );
    }


    /* NUEVO CUPÓN */

    const newCoupon =
      $("newCouponBtn");

    if (newCoupon) {

      newCoupon.addEventListener(
        "click",
        abrirNuevoCupon
      );
    }


    /* FORM OFERTA */

    const offerForm =
      $("offerForm");

    if (offerForm) {

      offerForm.addEventListener(
        "submit",
        guardarOferta
      );
    }


    /* FORM CUPÓN */

    const couponForm =
      $("couponForm");

    if (couponForm) {

      couponForm.addEventListener(
        "submit",
        guardarCupon
      );
    }


    /* PREVIEW */

    const offerImage =
      $("offerImage");

    if (offerImage) {

      offerImage.addEventListener(
        "change",
        vistaPreviaImagen
      );
    }


    /* BUSCAR OFERTAS */

    const offerSearch =
      $("offerSearch");

    if (offerSearch) {

      offerSearch.addEventListener(
        "input",
        renderOfertas
      );
    }


    /* FILTRO OFERTAS */

    const offerCategory =
      $("offerCategoryFilter");

    if (offerCategory) {

      offerCategory.addEventListener(
        "change",
        renderOfertas
      );
    }


    /* BUSCAR CUPONES */

    const couponSearch =
      $("couponSearch");

    if (couponSearch) {

      couponSearch.addEventListener(
        "input",
        renderCupones
      );
    }


    /* FILTRO CUPONES */

    const couponType =
      $("couponTypeFilter");

    if (couponType) {

      couponType.addEventListener(
        "change",
        renderCupones
      );
    }


    /* BUSCAR USUARIOS */

    const userSearch =
      $("userSearch");

    if (userSearch) {

      userSearch.addEventListener(
        "input",
        renderUsuarios
      );
    }


    /* REFRESH */

    const refresh =
      $("refreshBtn");

    if (refresh) {

      refresh.addEventListener(
        "click",
        async () => {

          if (!usuarioActual) {

            toast(
              "Inicia sesión primero.",
              "error"
            );

            return;
          }

          refresh.classList.add(
            "rotating"
          );

          await cargarTodo();

          refresh.classList.remove(
            "rotating"
          );

          toast(
            "Panel actualizado."
          );
        }
      );
    }


    /* MENÚ MÓVIL */

    const mobileMenu =
      $("mobileMenu");

    if (mobileMenu) {

      mobileMenu.addEventListener(
        "click",
        () => {

          const sidebar =
            $("sidebar");

          if (sidebar) {

            sidebar.classList.toggle(
              "open"
            );
          }
        }
      );
    }


    /* NAVEGACIÓN */

    document.addEventListener(
      "click",
      event => {

        const boton =
          event.target.closest(
            "[data-section]"
          );

        if (!boton) return;

        const seccion =
          boton.dataset.section;

        if (!seccion) return;

        cambiarSeccion(
          seccion
        );
      }
    );


    /* EDITAR / ELIMINAR */

    document.addEventListener(
      "click",
      event => {

        const editOffer =
          event.target.closest(
            "[data-edit-offer]"
          );

        if (editOffer) {

          editarOferta(
            editOffer.dataset.editOffer
          );

          return;
        }


        const deleteOffer =
          event.target.closest(
            "[data-delete-offer]"
          );

        if (deleteOffer) {

          eliminarOferta(
            deleteOffer.dataset.deleteOffer
          );

          return;
        }


        const editCoupon =
          event.target.closest(
            "[data-edit-coupon]"
          );

        if (editCoupon) {

          editarCupon(
            editCoupon.dataset.editCoupon
          );

          return;
        }


        const deleteCoupon =
          event.target.closest(
            "[data-delete-coupon]"
          );

        if (deleteCoupon) {

          eliminarCupon(
            deleteCoupon.dataset.deleteCoupon
          );

          return;
        }

      }
    );


    /* CERRAR MODALES */

    document.addEventListener(
      "click",
      event => {

        const boton =
          event.target.closest(
            "[data-close]"
          );

        if (boton) {

          cerrarModal(
            boton.dataset.close
          );

          return;
        }

        if (
          event.target.classList.contains(
            "modal-overlay"
          )
        ) {

          cerrarModal(
            event.target.id
          );
        }

      }
    );


    /* ESC */

    document.addEventListener(
      "keydown",
      event => {

        if (event.key !== "Escape") {
          return;
        }

        document
          .querySelectorAll(
            ".modal-overlay"
          )
          .forEach(modal => {

            if (
              modal.style.display ===
              "flex"
            ) {

              cerrarModal(
                modal.id
              );
            }
          });
      }
    );

  }
);


/* =========================================================
   EXPONER FUNCIONES
========================================================= */

window.iniciarSesion =
  iniciarSesion;

window.cerrarSesion =
  cerrarSesion;

window.abrirNuevaOferta =
  abrirNuevaOferta;

window.abrirNuevoCupon =
  abrirNuevoCupon;

window.editarOferta =
  editarOferta;

window.eliminarOferta =
  eliminarOferta;

window.editarCupon =
  editarCupon;

window.eliminarCupon =
  eliminarCupon;

window.guardarOferta =
  guardarOferta;

window.guardarCupon =
  guardarCupon;

window.cambiarSeccion =
  cambiarSeccion;

window.abrirModal =
  abrirModal;

window.cerrarModal =
  cerrarModal;

window.adminFirebase = {
  app,
  auth,
  db
};


console.log(
  "⚡ ADMIN PRO Firebase cargado correctamente."
);