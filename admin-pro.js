/* =========================================================
   ⚡ EL PATRÓN DE LAS OFERTAS
   ADMIN PRO
   Firebase + Firestore + Authentication
   Compatible con admin-pro.html ACTUAL
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
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
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


/* =========================================================
   INICIALIZAR FIREBASE
   ========================================================= */

let firebaseApp;
let auth;
let db;

try {

  firebaseApp = initializeApp(firebaseConfig);

  auth = getAuth(firebaseApp);

  db = getFirestore(firebaseApp);

  console.log("🔥 Firebase inicializado correctamente.");

} catch (error) {

  console.error(
    "❌ Error inicializando Firebase:",
    error
  );

  mostrarErrorCarga(
    "No se pudo conectar con Firebase."
  );
}


/* =========================================================
   ESTADO
   ========================================================= */

let usuarioActual = null;

let ofertas = [];

let cupones = [];

let usuarios = [];

let copias = [];

let visitas = [];

let compras = [];

let ofertaEditando = null;

let cuponEditando = null;


/* =========================================================
   UTILIDADES DOM
   ========================================================= */

const $ = (id) => document.getElementById(id);


function mostrarElemento(id) {

  const elemento = $(id);

  if (elemento) {
    elemento.style.display = "";
  }
}


function ocultarElemento(id) {

  const elemento = $(id);

  if (elemento) {
    elemento.style.display = "none";
  }
}


function texto(valor) {

  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  return String(valor);
}


function numero(valor) {

  const n = Number(valor);

  return Number.isFinite(n)
    ? n
    : 0;
}


function dinero(valor) {

  return new Intl.NumberFormat(
    "es-MX",
    {
      style: "currency",
      currency: "MXN"
    }
  ).format(numero(valor));
}


function escapar(valor) {

  return texto(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function fecha(valor) {

  if (!valor) {
    return "—";
  }

  try {

    const fechaReal =
      typeof valor.toDate === "function"
        ? valor.toDate()
        : new Date(valor);

    return fechaReal.toLocaleDateString(
      "es-MX",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    );

  } catch {

    return "—";
  }
}


/* =========================================================
   PANTALLA DE CARGA
   ========================================================= */

function ocultarCarga() {

  const loading = $("loadingScreen");

  if (loading) {

    loading.style.opacity = "0";

    setTimeout(() => {

      loading.style.display = "none";

    }, 250);
  }
}


function mostrarErrorCarga(mensaje) {

  const loading = $("loadingScreen");

  if (!loading) {
    return;
  }

  const textoCarga =
    loading.querySelector("p");

  if (textoCarga) {

    textoCarga.textContent =
      mensaje;

    textoCarga.style.color =
      "#dc2626";
  }

  const spinner =
    loading.querySelector(
      ".loading-spinner"
    );

  if (spinner) {
    spinner.style.display = "none";
  }
}


/* =========================================================
   TOAST
   ========================================================= */

function toast(
  mensaje,
  tipo = "success"
) {

  const caja = $("toast");

  const icono = $("toastIcon");

  const textoToast =
    $("toastMessage");

  if (!caja) {
    return;
  }

  if (textoToast) {
    textoToast.textContent =
      mensaje;
  }

  if (icono) {

    icono.textContent =
      tipo === "error"
        ? "❌"
        : tipo === "warning"
          ? "⚠️"
          : "✅";
  }

  caja.classList.add("show");

  clearTimeout(
    caja._timeout
  );

  caja._timeout =
    setTimeout(() => {

      caja.classList.remove("show");

    }, 3500);
}


/* =========================================================
   AUTH STATE
   ========================================================= */

if (auth) {

  onAuthStateChanged(
    auth,
    async (user) => {

      try {

        usuarioActual = user;

        if (user) {

          console.log(
            "👤 Administrador:",
            user.email
          );

          await iniciarAdmin(
            user
          );

        } else {

          mostrarLogin();

        }

      } catch (error) {

        console.error(
          "Error iniciando Admin:",
          error
        );

        mostrarErrorCarga(
          "Error cargando el administrador."
        );
      }

    }
  );

}


/* =========================================================
   MOSTRAR LOGIN
   ========================================================= */

function mostrarLogin() {

  ocultarElemento(
    "adminApp"
  );

  mostrarElemento(
    "loginScreen"
  );

  ocultarCarga();

}


/* =========================================================
   INICIAR ADMIN
   ========================================================= */

async function iniciarAdmin(
  user
) {

  ocultarElemento(
    "loginScreen"
  );

  mostrarElemento(
    "adminApp"
  );

  ocultarCarga();

  actualizarUsuarioUI(
    user
  );

  actualizarConexion(
    true
  );

  await cargarTodo();

}


/* =========================================================
   USUARIO UI
   ========================================================= */

function actualizarUsuarioUI(
  user
) {

  const email =
    user?.email || "";

  const adminEmail =
    $("adminEmail");

  if (adminEmail) {
    adminEmail.textContent =
      email;
  }

  const settingsEmail =
    $("settingsEmail");

  if (settingsEmail) {
    settingsEmail.textContent =
      email;
  }

}


/* =========================================================
   CONEXIÓN
   ========================================================= */

function actualizarConexion(
  conectado
) {

  const dot =
    $("connectionDot");

  const textoConexion =
    $("connectionText");

  const authStatus =
    $("authStatus");

  if (conectado) {

    if (dot) {

      dot.classList.add(
        "online"
      );
    }

    if (textoConexion) {

      textoConexion.textContent =
        "Firebase conectado";
    }

    if (authStatus) {

      authStatus.textContent =
        "Activo";
    }

  } else {

    if (dot) {

      dot.classList.remove(
        "online"
      );
    }

    if (textoConexion) {

      textoConexion.textContent =
        "Sin conexión";
    }

    if (authStatus) {

      authStatus.textContent =
        "Desconectado";
    }
  }

}


/* =========================================================
   LOGIN
   ========================================================= */

$("loginForm")?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const email =
      $("loginEmail")?.value.trim();

    const password =
      $("loginPassword")?.value;

    const errorBox =
      $("loginError");

    if (errorBox) {

      errorBox.textContent = "";

      errorBox.style.display =
        "none";
    }

    if (!email || !password) {

      mostrarLoginError(
        "Escribe tu correo y contraseña."
      );

      return;
    }

    const boton =
      $("loginForm")
        .querySelector(
          'button[type="submit"]'
        );

    if (boton) {

      boton.disabled = true;

      boton.textContent =
        "⏳ ENTRANDO...";
    }

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    } catch (error) {

      console.error(
        "Login:",
        error
      );

      let mensaje =
        "No se pudo iniciar sesión.";

      switch (error.code) {

        case "auth/invalid-credential":
          mensaje =
            "Correo o contraseña incorrectos.";
          break;

        case "auth/user-not-found":
          mensaje =
            "El usuario no existe.";
          break;

        case "auth/wrong-password":
          mensaje =
            "Contraseña incorrecta.";
          break;

        case "auth/invalid-email":
          mensaje =
            "El correo no es válido.";
          break;

        case "auth/too-many-requests":
          mensaje =
            "Demasiados intentos. Espera unos minutos.";
          break;

        case "auth/network-request-failed":
          mensaje =
            "No hay conexión con Firebase.";
          break;

      }

      mostrarLoginError(
        mensaje
      );

      if (boton) {

        boton.disabled = false;

        boton.textContent =
          "🔐 ENTRAR";
      }

    }

  }
);


/* =========================================================
   ERROR LOGIN
   ========================================================= */

function mostrarLoginError(
  mensaje
) {

  const errorBox =
    $("loginError");

  if (!errorBox) {
    return;
  }

  errorBox.textContent =
    mensaje;

  errorBox.style.display =
    "block";
}


/* =========================================================
   MOSTRAR / OCULTAR CONTRASEÑA
   ========================================================= */

$("togglePassword")?.addEventListener(
  "click",
  () => {

    const password =
      $("loginPassword");

    const boton =
      $("togglePassword");

    if (!password) {
      return;
    }

    if (
      password.type ===
      "password"
    ) {

      password.type =
        "text";

      if (boton) {
        boton.textContent =
          "🙈";
      }

    } else {

      password.type =
        "password";

      if (boton) {
        boton.textContent =
          "👁️";
      }

    }

  }
);


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

async function cerrarSesion() {

  try {

    await signOut(auth);

    toast(
      "Sesión cerrada."
    );

  } catch (error) {

    console.error(error);

    toast(
      "No se pudo cerrar sesión.",
      "error"
    );
  }

}


$("logoutBtn")?.addEventListener(
  "click",
  cerrarSesion
);


$("settingsLogoutBtn")
  ?.addEventListener(
    "click",
    cerrarSesion
  );


/* =========================================================
   NAVEGACIÓN
   ========================================================= */

const menuItems =
  document.querySelectorAll(
    ".menu-item"
  );


const sections =
  document.querySelectorAll(
    ".admin-section"
  );


function cambiarSeccion(
  nombre
) {

  menuItems.forEach(
    (item) => {

      item.classList.toggle(
        "active",
        item.dataset.section ===
          nombre
      );

    }
  );


  sections.forEach(
    (section) => {

      section.classList.toggle(
        "active",
        section.id ===
          `section-${nombre}`
      );

    }
  );


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
      "Gestiona tus cupones"
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


  const datos =
    titulos[nombre] ||
    titulos.dashboard;


  const title =
    $("pageTitle");

  const subtitle =
    $("pageSubtitle");


  if (title) {
    title.textContent =
      datos[0];
  }

  if (subtitle) {
    subtitle.textContent =
      datos[1];
  }


  if (nombre === "usuarios") {
    cargarUsuarios();
  }

  if (nombre === "estadisticas") {
    cargarEstadisticas();
  }

}


menuItems.forEach(
  (item) => {

    item.addEventListener(
      "click",
      () => {

        cambiarSeccion(
          item.dataset.section
        );

      }
    );

  }
);


document
  .querySelectorAll(
    "[data-section]"
  )
  .forEach(
    (elemento) => {

      if (
        !elemento.classList.contains(
          "menu-item"
        )
      ) {

        elemento.addEventListener(
          "click",
          () => {

            cambiarSeccion(
              elemento.dataset.section
            );

          }
        );

      }

    }
  );


/* =========================================================
   MENÚ MÓVIL
   ========================================================= */

$("mobileMenu")
  ?.addEventListener(
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


/* =========================================================
   BOTÓN ACTUALIZAR
   ========================================================= */

$("refreshBtn")
  ?.addEventListener(
    "click",
    async () => {

      if (!usuarioActual) {
        return;
      }

      const boton =
        $("refreshBtn");

      if (boton) {

        boton.disabled = true;

        boton.textContent =
          "⏳";
      }

      try {

        await cargarTodo();

        toast(
          "Información actualizada."
        );

      } catch (error) {

        console.error(error);

        toast(
          "Error actualizando.",
          "error"
        );

      } finally {

        if (boton) {

          boton.disabled = false;

          boton.textContent =
            "🔄";
        }

      }

    }
  );


/* =========================================================
   CARGAR TODO
   ========================================================= */

async function cargarTodo() {

  await Promise.all([

    cargarOfertas(),

    cargarCupones(),

    cargarUsuarios(),

    cargarCopias(),

    cargarVisitas(),

    cargarCompras()

  ]);

  actualizarDashboard();

  cargarEstadisticas();

}


/* =========================================================
   OFERTAS
   ========================================================= */

async function cargarOfertas() {

  try {

    const referencia =
      collection(
        db,
        "ofertas"
      );

    const snapshot =
      await getDocs(
        referencia
      );

    ofertas = [];

    snapshot.forEach(
      (item) => {

        ofertas.push({

          id: item.id,

          ...item.data()

        });

      }
    );


    ofertas.sort(
      (a, b) => {

        const aFecha =
          obtenerFecha(
            a.creadoEn
          );

        const bFecha =
          obtenerFecha(
            b.creadoEn
          );

        return (
          bFecha - aFecha
        );

      }
    );


    renderOfertas();

    renderOfertasRecientes();

    llenarCategorias();

  } catch (error) {

    console.error(
      "Error ofertas:",
      error
    );

    renderErrorTabla(
      "offersTable",
      6,
      "No se pudieron cargar las ofertas."
    );

  }

}


/* =========================================================
   RENDER OFERTAS
   ========================================================= */

function renderOfertas() {

  const tbody =
    $("offersTable");

  if (!tbody) {
    return;
  }

  const busqueda =
    texto(
      $("offerSearch")?.value
    )
      .toLowerCase()
      .trim();

  const categoria =
    $("offerCategoryFilter")
      ?.value || "";


  const filtradas =
    ofertas.filter(
      (oferta) => {

        const titulo =
          texto(
            oferta.titulo ||
            oferta.title
          ).toLowerCase();

        const cat =
          texto(
            oferta.categoria ||
            oferta.category
          );


        const coincideTexto =
          !busqueda ||
          titulo.includes(
            busqueda
          );

        const coincideCategoria =
          !categoria ||
          cat === categoria;


        return (
          coincideTexto &&
          coincideCategoria
        );

      }
    );


  if (!filtradas.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="table-loading"
        >
          No hay ofertas.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    filtradas.map(
      (oferta) => {

        const titulo =
          oferta.titulo ||
          oferta.title ||
          "Sin título";

        const precioAntes =
          numero(
            oferta.precioAntes ??
            oferta.precioAnterior ??
            oferta.oldPrice
          );

        const precio =
          numero(
            oferta.precioActual ??
            oferta.precio ??
            oferta.price
          );

        const categoria =
          oferta.categoria ||
          oferta.category ||
          "—";

        const clicks =
          numero(
            oferta.clics ??
            oferta.clicks
          );


        return `

          <tr>

            <td>

              <div
                style="
                  display:flex;
                  align-items:center;
                  gap:10px;
                "
              >

                ${
                  oferta.imagen
                    ? `
                      <img
                        src="${escapar(
                          oferta.imagen
                        )}"
                        style="
                          width:48px;
                          height:48px;
                          object-fit:cover;
                          border-radius:8px;
                        "
                      >
                    `
                    : `
                      <div
                        style="
                          width:48px;
                          height:48px;
                          display:flex;
                          align-items:center;
                          justify-content:center;
                          border-radius:8px;
                          background:#f1f5f9;
                        "
                      >
                        🛒
                      </div>
                    `
                }

                <strong>
                  ${escapar(
                    titulo
                  )}
                </strong>

              </div>

            </td>


            <td>
              ${
                precioAntes
                  ? dinero(
                      precioAntes
                    )
                  : "—"
              }
            </td>


            <td>
              <strong>
                ${dinero(
                  precio
                )}
              </strong>
            </td>


            <td>
              ${escapar(
                categoria
              )}
            </td>


            <td>
              ${clicks.toLocaleString(
                "es-MX"
              )}
            </td>


            <td>

              <div
                style="
                  display:flex;
                  gap:6px;
                "
              >

                <button
                  class="secondary-button"
                  onclick="editarOferta('${oferta.id}')"
                  title="Editar"
                >
                  ✏️
                </button>

                <button
                  class="danger-button"
                  onclick="eliminarOferta('${oferta.id}')"
                  title="Eliminar"
                >
                  🗑️
                </button>

              </div>

            </td>

          </tr>

        `;

      }
    ).join("");

}


/* =========================================================
   OFERTAS RECIENTES
   ========================================================= */

function renderOfertasRecientes() {

  const contenedor =
    $("recentOffers");

  if (!contenedor) {
    return;
  }

  const recientes =
    ofertas.slice(
      0,
      5
    );


  if (!recientes.length) {

    contenedor.innerHTML = `
      <div class="empty-state">
        No hay ofertas publicadas.
      </div>
    `;

    return;
  }


  contenedor.innerHTML =
    recientes.map(
      (oferta) => {

        const titulo =
          oferta.titulo ||
          oferta.title ||
          "Sin título";

        const precio =
          numero(
            oferta.precioActual ??
            oferta.precio ??
            oferta.price
          );


        return `

          <div
            class="recent-item"
            style="
              display:flex;
              align-items:center;
              gap:12px;
            "
          >

            ${
              oferta.imagen
                ? `
                  <img
                    src="${escapar(
                      oferta.imagen
                    )}"
                    style="
                      width:48px;
                      height:48px;
                      object-fit:cover;
                      border-radius:8px;
                    "
                  >
                `
                : "🔥"
            }

            <div>

              <strong>
                ${escapar(
                  titulo
                )}
              </strong>

              <small>
                ${dinero(
                  precio
                )}
              </small>

            </div>

          </div>

        `;

      }
    ).join("");

}


/* =========================================================
   CATEGORÍAS
   ========================================================= */

function llenarCategorias() {

  const select =
    $("offerCategoryFilter");

  if (!select) {
    return;
  }

  const categorias =
    [
      ...new Set(
        ofertas
          .map(
            o =>
              o.categoria ||
              o.category
          )
          .filter(Boolean)
      )
    ]
    .sort();


  select.innerHTML = `
    <option value="">
      Todas las categorías
    </option>
  `;


  categorias.forEach(
    (categoria) => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        categoria;

      option.textContent =
        categoria;

      select.appendChild(
        option
      );

    }
  );

}


/* =========================================================
   NUEVA OFERTA
   ========================================================= */

$("newOfferBtn")
  ?.addEventListener(
    "click",
    () => {

      abrirModalOferta();

    }
  );


function abrirModalOferta(
  oferta = null
) {

  ofertaEditando =
    oferta?.id || null;


  $("offerId").value =
    oferta?.id || "";


  $("offerTitle").value =
    oferta?.titulo ||
    oferta?.title ||
    "";


  $("offerOldPrice").value =
    oferta?.precioAntes ??
    oferta?.precioAnterior ??
    oferta?.oldPrice ??
    "";


  $("offerPrice").value =
    oferta?.precioActual ??
    oferta?.precio ??
    oferta?.price ??
    "";


  $("offerCategory").value =
    oferta?.categoria ||
    oferta?.category ||
    "";


  $("offerClicks").value =
    oferta?.clics ??
    oferta?.clicks ??
    0;


  $("offerLink").value =
    oferta?.link ||
    oferta?.url ||
    "";


  const preview =
    $("offerImagePreview");

  if (preview) {

    if (oferta?.imagen) {

      preview.innerHTML = `
        <img
          src="${escapar(
            oferta.imagen
          )}"
          style="
            max-width:100%;
            max-height:220px;
            border-radius:12px;
          "
        >
      `;

    } else {

      preview.innerHTML =
        "";
    }

  }


  const titulo =
    $("offerModalTitle");

  if (titulo) {

    titulo.textContent =
      oferta
        ? "Editar oferta"
        : "Nueva oferta";

  }


  abrirModal(
    "offerModal"
  );

}


/* =========================================================
   GUARDAR OFERTA
   ========================================================= */

$("offerForm")
  ?.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (!usuarioActual) {
        toast(
          "Debes iniciar sesión.",
          "error"
        );
        return;
      }


      const titulo =
        $("offerTitle")
          ?.value.trim();

      const precioAntes =
        numero(
          $("offerOldPrice")
            ?.value
        );

      const precioActual =
        numero(
          $("offerPrice")
            ?.value
        );

      const categoria =
        $("offerCategory")
          ?.value.trim();

      const clicks =
        numero(
          $("offerClicks")
            ?.value
        );

      const link =
        $("offerLink")
          ?.value.trim();

      const archivo =
        $("offerImage")
          ?.files?.[0];


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
          "Agrega el link de Mercado Libre.",
          "error"
        );

        return;
      }


      const boton =
        event.target.querySelector(
          'button[type="submit"]'
        );

      if (boton) {

        boton.disabled = true;

        boton.textContent =
          "⏳ Guardando...";
      }


      try {

        let imagen =
          ofertaEditando
            ? (
                ofertas.find(
                  o =>
                    o.id ===
                    ofertaEditando
                )?.imagen || ""
              )
            : "";


        if (archivo) {

          imagen =
            await archivoABase64(
              archivo
            );

        }


        const datos = {

          titulo,

          precioAntes,

          precioActual,

          categoria,

          clics: clicks,

          link,

          imagen,

          ahorro:
            Math.max(
              precioAntes -
              precioActual,
              0
            ),

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
            "Oferta actualizada."
          );

        } else {

          await addDoc(
            collection(
              db,
              "ofertas"
            ),
            {

              ...datos,

              creadoPor:
                usuarioActual.email,

              creadoEn:
                serverTimestamp()

            }
          );

          toast(
            "Oferta publicada correctamente."
          );

        }


        cerrarModal(
          "offerModal"
        );


        limpiarOfertaForm();

        await cargarOfertas();

        actualizarDashboard();


      } catch (error) {

        console.error(
          "Guardar oferta:",
          error
        );

        toast(
          "Error guardando oferta: " +
          error.message,
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
  );


/* =========================================================
   EDITAR OFERTA
   ========================================================= */

window.editarOferta =
  function(id) {

    const oferta =
      ofertas.find(
        o =>
          o.id === id
      );

    if (!oferta) {

      toast(
        "Oferta no encontrada.",
        "error"
      );

      return;
    }

    abrirModalOferta(
      oferta
    );

  };


/* =========================================================
   ELIMINAR OFERTA
   ========================================================= */

window.eliminarOferta =
  async function(id) {

    if (!usuarioActual) {
      return;
    }

    const oferta =
      ofertas.find(
        o =>
          o.id === id
      );


    if (!confirm(
      `¿Eliminar la oferta "${
        oferta?.titulo ||
        oferta?.title ||
        ""
      }"?`
    )) {

      return;
    }


    try {

      await deleteDoc(
        doc(
          db,
          "ofertas",
          id
        )
      );


      toast(
        "Oferta eliminada."
      );


      await cargarOfertas();

      actualizarDashboard();


    } catch (error) {

      console.error(error);

      toast(
        "No se pudo eliminar.",
        "error"
      );

    }

  };


/* =========================================================
   PREVISUALIZACIÓN IMAGEN
   ========================================================= */

$("offerImage")
  ?.addEventListener(
    "change",
    async () => {

      const archivo =
        $("offerImage")
          ?.files?.[0];

      const preview =
        $("offerImagePreview");

      if (!archivo || !preview) {
        return;
      }


      if (
        !archivo.type.startsWith(
          "image/"
        )
      ) {

        preview.innerHTML =
          "Archivo no válido.";

        return;
      }


      try {

        const base64 =
          await archivoABase64(
            archivo
          );

        preview.innerHTML = `
          <img
            src="${base64}"
            style="
              max-width:100%;
              max-height:220px;
              border-radius:12px;
            "
          >
        `;

      } catch {

        preview.innerHTML =
          "No se pudo mostrar la imagen.";

      }

    }
  );


/* =========================================================
   ARCHIVO A BASE64
   ========================================================= */

function archivoABase64(
  archivo
) {

  return new Promise(
    (resolve, reject) => {

      const lector =
        new FileReader();

      lector.onload =
        () =>
          resolve(
            lector.result
          );

      lector.onerror =
        reject;

      lector.readAsDataURL(
        archivo
      );

    }
  );

}


/* =========================================================
   CUPONES
   ========================================================= */

async function cargarCupones() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "cupones"
        )
      );


    cupones = [];


    snapshot.forEach(
      (item) => {

        cupones.push({

          id: item.id,

          ...item.data()

        });

      }
    );


    cupones.sort(
      (a, b) => {

        return (
          obtenerFecha(
            b.creadoEn
          ) -
          obtenerFecha(
            a.creadoEn
          )
        );

      }
    );


    renderCupones();

    renderTopCupones();

  } catch (error) {

    console.error(
      "Error cupones:",
      error
    );

    renderErrorTabla(
      "couponsTable",
      7,
      "No se pudieron cargar los cupones."
    );

  }

}


/* =========================================================
   RENDER CUPONES
   ========================================================= */

function renderCupones() {

  const tbody =
    $("couponsTable");

  if (!tbody) {
    return;
  }


  const busqueda =
    texto(
      $("couponSearch")
        ?.value
    )
      .toLowerCase()
      .trim();


  const tipo =
    $("couponTypeFilter")
      ?.value || "";


  const filtrados =
    cupones.filter(
      (cupon) => {

        const codigo =
          texto(
            cupon.codigo ||
            cupon.code
          ).toLowerCase();

        const descripcion =
          texto(
            cupon.descripcion ||
            cupon.description
          ).toLowerCase();

        const tipoCupon =
          cupon.tipo ||
          cupon.type ||
          "";


        const coincideBusqueda =
          !busqueda ||
          codigo.includes(
            busqueda
          ) ||
          descripcion.includes(
            busqueda
          );


        const coincideTipo =
          !tipo ||
          tipoCupon === tipo;


        return (
          coincideBusqueda &&
          coincideTipo
        );

      }
    );


  if (!filtrados.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="table-loading"
        >
          No hay cupones.
        </td>
      </tr>
    `;

    return;

  }


  tbody.innerHTML =
    filtrados.map(
      (cupon) => {

        const codigo =
          cupon.codigo ||
          cupon.code ||
          "—";

        const tipoCupon =
          cupon.tipo ||
          cupon.type ||
          "—";

        const descuento =
          cupon.descuento ||
          cupon.discount ||
          "—";

        const minimo =
          numero(
            cupon.minimo ??
            cupon.minimum
          );

        const tope =
          numero(
            cupon.tope ??
            cupon.maximum
          );

        const copias =
          numero(
            cupon.copias ??
            cupon.copies
          );


        return `

          <tr>

            <td>

              <strong>
                🎟️ ${escapar(
                  codigo
                )}
              </strong>

            </td>


            <td>
              ${tipoIcono(
                tipoCupon
              )}
              ${escapar(
                tipoCupon
              )}
            </td>


            <td>
              ${escapar(
                descuento
              )}
            </td>


            <td>
              ${
                minimo
                  ? dinero(
                      minimo
                    )
                  : "—"
              }
            </td>


            <td>
              ${
                tope
                  ? dinero(
                      tope
                    )
                  : "—"
              }
            </td>


            <td>
              ${copias.toLocaleString(
                "es-MX"
              )}
            </td>


            <td>

              <div
                style="
                  display:flex;
                  gap:6px;
                "
              >

                <button
                  class="secondary-button"
                  onclick="editarCupon('${cupon.id}')"
                >
                  ✏️
                </button>

                <button
                  class="danger-button"
                  onclick="eliminarCupon('${cupon.id}')"
                >
                  🗑️
                </button>

              </div>

            </td>

          </tr>

        `;

      }
    ).join("");

}


/* =========================================================
   ICONO CUPÓN
   ========================================================= */

function tipoIcono(
  tipo
) {

  switch (tipo) {

    case "relampago":
      return "⚡";

    case "bancario":
      return "🏦";

    case "meliplus":
      return "💛";

    default:
      return "🎟️";

  }

}


/* =========================================================
   CUPONES MÁS USADOS
   ========================================================= */

function renderTopCupones() {

  const contenedor =
    $("topCoupons");

  if (!contenedor) {
    return;
  }


  const ordenados =
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
      .slice(
        0,
        5
      );


  if (!ordenados.length) {

    contenedor.innerHTML = `
      <div class="empty-state">
        No hay cupones.
      </div>
    `;

    return;
  }


  contenedor.innerHTML =
    ordenados.map(
      (cupon) => {

        const codigo =
          cupon.codigo ||
          cupon.code ||
          "—";

        const copias =
          numero(
            cupon.copias ??
            cupon.copies
          );


        return `

          <div
            class="recent-item"
          >

            <strong>
              ${tipoIcono(
                cupon.tipo ||
                cupon.type
              )}
              ${escapar(
                codigo
              )}
            </strong>

            <small>
              ${copias.toLocaleString(
                "es-MX"
              )}
              copias
            </small>

          </div>

        `;

      }
    ).join("");

}


/* =========================================================
   NUEVO CUPÓN
   ========================================================= */

$("newCouponBtn")
  ?.addEventListener(
    "click",
    () => {

      abrirModalCupon();

    }
  );


function abrirModalCupon(
  cupon = null
) {

  cuponEditando =
    cupon?.id || null;


  $("couponId").value =
    cupon?.id || "";


  $("couponCode").value =
    cupon?.codigo ||
    cupon?.code ||
    "";


  $("couponType").value =
    cupon?.tipo ||
    cupon?.type ||
    "relampago";


  $("couponDiscount").value =
    cupon?.descuento ||
    cupon?.discount ||
    "";


  $("couponMinimum").value =
    cupon?.minimo ??
    cupon?.minimum ??
    "";


  $("couponMaximum").value =
    cupon?.tope ??
    cupon?.maximum ??
    "";


  $("couponCopies").value =
    cupon?.copias ??
    cupon?.copies ??
    0;


  $("couponStatus").value =
    cupon?.estado ||
    cupon?.status ||
    "activo";


  $("couponDescription").value =
    cupon?.descripcion ||
    cupon?.description ||
    "";


  const titulo =
    $("couponModalTitle");

  if (titulo) {

    titulo.textContent =
      cupon
        ? "Editar cupón"
        : "Nuevo cupón";

  }


  abrirModal(
    "couponModal"
  );

}


/* =========================================================
   GUARDAR CUPÓN
   ========================================================= */

$("couponForm")
  ?.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      if (!usuarioActual) {

        toast(
          "Debes iniciar sesión.",
          "error"
        );

        return;
      }


      const codigo =
        $("couponCode")
          ?.value.trim();

      const tipo =
        $("couponType")
          ?.value;

      const descuento =
        $("couponDiscount")
          ?.value.trim();

      const minimo =
        numero(
          $("couponMinimum")
            ?.value
        );

      const tope =
        numero(
          $("couponMaximum")
            ?.value
        );

      const copias =
        numero(
          $("couponCopies")
            ?.value
        );

      const estado =
        $("couponStatus")
          ?.value;

      const descripcion =
        $("couponDescription")
          ?.value.trim();


      if (!codigo) {

        toast(
          "Escribe el código.",
          "error"
        );

        return;
      }


      const boton =
        event.target.querySelector(
          'button[type="submit"]'
        );


      if (boton) {

        boton.disabled = true;

        boton.textContent =
          "⏳ Guardando...";

      }


      try {

        const datos = {

          codigo,

          tipo,

          descuento,

          minimo,

          tope,

          copias,

          estado,

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
            "Cupón actualizado."
          );

        } else {

          await addDoc(
            collection(
              db,
              "cupones"
            ),
            {

              ...datos,

              creadoPor:
                usuarioActual.email,

              creadoEn:
                serverTimestamp()

            }
          );

          toast(
            "Cupón publicado correctamente."
          );

        }


        cerrarModal(
          "couponModal"
        );

        limpiarCuponForm();

        await cargarCupones();

        actualizarDashboard();


      } catch (error) {

        console.error(
          "Guardar cupón:",
          error
        );

        toast(
          "Error guardando cupón: " +
          error.message,
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
  );


/* =========================================================
   EDITAR CUPÓN
   ========================================================= */

window.editarCupon =
  function(id) {

    const cupon =
      cupones.find(
        c =>
          c.id === id
      );


    if (!cupon) {

      toast(
        "Cupón no encontrado.",
        "error"
      );

      return;
    }


    abrirModalCupon(
      cupon
    );

  };


/* =========================================================
   ELIMINAR CUPÓN
   ========================================================= */

window.eliminarCupon =
  async function(id) {

    if (!confirm(
      "¿Seguro que quieres eliminar este cupón?"
    )) {

      return;
    }


    try {

      await deleteDoc(
        doc(
          db,
          "cupones",
          id
        )
      );


      toast(
        "Cupón eliminado."
      );


      await cargarCupones();

      actualizarDashboard();


    } catch (error) {

      console.error(error);

      toast(
        "No se pudo eliminar.",
        "error"
      );

    }

  };


/* =========================================================
   USUARIOS
   ========================================================= */

async function cargarUsuarios() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "usuarios"
        )
      );


    usuarios = [];


    snapshot.forEach(
      (item) => {

        usuarios.push({

          id: item.id,

          ...item.data()

        });

      }
    );


    renderUsuarios();


  } catch (error) {

    console.error(
      "Usuarios:",
      error
    );

    renderErrorTabla(
      "usersTable",
      7,
      "No se pudieron cargar los usuarios."
    );

  }

}


/* =========================================================
   RENDER USUARIOS
   ========================================================= */

function renderUsuarios() {

  const tbody =
    $("usersTable");

  if (!tbody) {
    return;
  }


  const busqueda =
    texto(
      $("userSearch")
        ?.value
    )
      .toLowerCase()
      .trim();


  const filtrados =
    usuarios.filter(
      (usuario) => {

        const nombre =
          texto(
            usuario.nombre ||
            usuario.name
          ).toLowerCase();

        const email =
          texto(
            usuario.email ||
            usuario.correo
          ).toLowerCase();


        return (
          !busqueda ||
          nombre.includes(
            busqueda
          ) ||
          email.includes(
            busqueda
          )
        );

      }
    );


  if (!filtrados.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="table-loading"
        >
          No hay usuarios registrados.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    filtrados.map(
      (usuario) => {

        const nombre =
          usuario.nombre ||
          usuario.name ||
          "Usuario";

        const email =
          usuario.email ||
          usuario.correo ||
          "—";

        const visitasUsuario =
          numero(
            usuario.visitas
          );

        const comprasUsuario =
          numero(
            usuario.compras
          );

        const ahorro =
          numero(
            usuario.ahorroTotal ||
            usuario.ahorro
          );

        const estado =
          usuario.estado ||
          "Activo";


        return `

          <tr>

            <td>
              <strong>
                ${escapar(
                  nombre
                )}
              </strong>
            </td>

            <td>
              ${escapar(
                email
              )}
            </td>

            <td>
              ${escapar(
                estado
              )}
            </td>

            <td>
              ${visitasUsuario}
            </td>

            <td>
              ${comprasUsuario}
            </td>

            <td>
              ${dinero(
                ahorro
              )}
            </td>

            <td>
              ${fecha(
                usuario.creadoEn ||
                usuario.registro
              )}
            </td>

          </tr>

        `;

      }
    ).join("");

}


/* =========================================================
   COPIAS
   ========================================================= */

async function cargarCopias() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "copias"
        )
      );


    copias = [];


    snapshot.forEach(
      (item) => {

        copias.push({

          id: item.id,

          ...item.data()

        });

      }
    );

  } catch (error) {

    console.error(
      "Copias:",
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
        collection(
          db,
          "visitas"
        )
      );


    visitas = [];


    snapshot.forEach(
      (item) => {

        visitas.push({

          id: item.id,

          ...item.data()

        });

      }
    );

  } catch (error) {

    console.error(
      "Visitas:",
      error
    );

    visitas = [];

  }

}


/* =========================================================
   COMPRAS
   ========================================================= */

async function cargarCompras() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "compras"
        )
      );


    compras = [];


    snapshot.forEach(
      (item) => {

        compras.push({

          id: item.id,

          ...item.data()

        });

      }
    );

  } catch (error) {

    console.error(
      "Compras:",
      error
    );

    compras = [];

  }

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function actualizarDashboard() {

  actualizarNumero(
    "totalOfertas",
    ofertas.length
  );


  actualizarNumero(
    "totalCupones",
    cupones.length
  );


  const totalClics =
    ofertas.reduce(
      (
        total,
        oferta
      ) =>
        total +
        numero(
          oferta.clics ??
          oferta.clicks
        ),
      0
    );


  actualizarNumero(
    "totalClics",
    totalClics
  );


  actualizarNumero(
    "totalUsuarios",
    usuarios.length
  );


  const ahorro =
    usuarios.reduce(
      (
        total,
        usuario
      ) =>
        total +
        numero(
          usuario.ahorroTotal ||
          usuario.ahorro
        ),
      0
    );


  const ahorroOfertas =
    ofertas.reduce(
      (
        total,
        oferta
      ) =>
        total +
        numero(
          oferta.ahorro
        ),
      0
    );


  const ahorroFinal =
    ahorro ||
    ahorroOfertas;


  const ahorroElemento =
    $("ahorroTotal");

  if (ahorroElemento) {

    ahorroElemento.textContent =
      dinero(
        ahorroFinal
      );

  }


  actualizarNumero(
    "totalCompras",
    compras.length
  );


  renderTopOferta();

}


/* =========================================================
   TOP OFERTA
   ========================================================= */

function renderTopOferta() {

  const contenedor =
    $("topOffer");

  if (!contenedor) {
    return;
  }


  const ordenadas =
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
      );


  const top =
    ordenadas[0];


  if (!top) {

    contenedor.innerHTML = `
      <div class="empty-state">
        Todavía no hay ofertas.
      </div>
    `;

    return;
  }


  const titulo =
    top.titulo ||
    top.title ||
    "Oferta";


  const clicks =
    numero(
      top.clics ??
      top.clicks
    );


  contenedor.innerHTML = `

    <div
      style="
        display:flex;
        align-items:center;
        gap:15px;
        padding:10px;
      "
    >

      <div
        style="
          font-size:36px;
        "
      >
        🏆
      </div>

      <div>

        <strong>
          ${escapar(
            titulo
          )}
        </strong>

        <div>
          ${clicks.toLocaleString(
            "es-MX"
          )}
          clics
        </div>

      </div>

    </div>

  `;

}


/* =========================================================
   ESTADÍSTICAS
   ========================================================= */

function cargarEstadisticas() {

  renderClickStats();

  renderCouponStats();

  renderStateStats();

  renderDailyStats();

}


/* =========================================================
   ESTADÍSTICAS CLICS
   ========================================================= */

function renderClickStats() {

  const contenedor =
    $("clickStats");

  if (!contenedor) {
    return;
  }


  const ordenadas =
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
      .slice(
        0,
        10
      );


  if (!ordenadas.length) {

    contenedor.innerHTML =
      `<div class="empty-state">
        Sin datos de clics.
      </div>`;

    return;
  }


  contenedor.innerHTML =
    ordenadas.map(
      (oferta) => {

        const titulo =
          oferta.titulo ||
          oferta.title ||
          "Oferta";

        const clicks =
          numero(
            oferta.clics ??
            oferta.clicks
          );


        return `

          <div
            style="
              display:flex;
              justify-content:space-between;
              padding:8px 0;
            "
          >

            <span>
              ${escapar(
                titulo
              )}
            </span>

            <strong>
              ${clicks.toLocaleString(
                "es-MX"
              )}
            </strong>

          </div>

        `;

      }
    ).join("");

}


/* =========================================================
   ESTADÍSTICAS CUPONES
   ========================================================= */

function renderCouponStats() {

  const contenedor =
    $("couponStats");

  if (!contenedor) {
    return;
  }


  const ordenados =
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
      .slice(
        0,
        10
      );


  if (!ordenados.length) {

    contenedor.innerHTML =
      `<div class="empty-state">
        Sin datos de cupones.
      </div>`;

    return;
  }


  contenedor.innerHTML =
    ordenados.map(
      (cupon) => {

        const codigo =
          cupon.codigo ||
          cupon.code ||
          "Cupón";

        const copias =
          numero(
            cupon.copias ??
            cupon.copies
          );


        return `

          <div
            style="
              display:flex;
              justify-content:space-between;
              padding:8px 0;
            "
          >

            <span>
              🎟️ ${escapar(
                codigo
              )}
            </span>

            <strong>
              ${copias.toLocaleString(
                "es-MX"
              )}
            </strong>

          </div>

        `;

      }
    ).join("");

}


/* =========================================================
   ESTADOS DE MÉXICO
   ========================================================= */

function renderStateStats() {

  const contenedor =
    $("stateStats");

  if (!contenedor) {
    return;
  }


  const estados = {};


  usuarios.forEach(
    (usuario) => {

      const estado =
        usuario.estadoMexico ||
        usuario.estado ||
        usuario.state ||
        "Sin especificar";


      estados[estado] =
        (
          estados[estado] ||
          0
        ) + 1;

    }
  );


  const lista =
    Object.entries(
      estados
    )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(
        0,
        10
      );


  if (!lista.length) {

    contenedor.innerHTML =
      `<div class="empty-state">
        Sin datos de estados.
      </div>`;

    return;
  }


  contenedor.innerHTML =
    lista.map(
      ([estado, cantidad]) =>
        `

          <div
            style="
              display:flex;
              justify-content:space-between;
              padding:8px 0;
            "
          >

            <span>
              🇲🇽 ${escapar(
                estado
              )}
            </span>

            <strong>
              ${cantidad}
            </strong>

          </div>

        `
    ).join("");

}


/* =========================================================
   ACTIVIDAD DIARIA
   ========================================================= */

function renderDailyStats() {

  const contenedor =
    $("dailyStats");

  if (!contenedor) {
    return;
  }


  const dias = {};


  [...visitas, ...copias].forEach(
    (item) => {

      const timestamp =
        item.creadoEn ||
        item.fecha ||
        item.timestamp;


      const date =
        obtenerFecha(
          timestamp
        );


      if (!date) {
        return;
      }


      const clave =
        new Date(
          date
        ).toLocaleDateString(
          "es-MX"
        );


      dias[clave] =
        (
          dias[clave] ||
          0
        ) + 1;

    }
  );


  const lista =
    Object.entries(
      dias
    )
      .sort(
        (a, b) => {

          const da =
            new Date(
              a[0]
            );

          const db =
            new Date(
              b[0]
            );

          return db - da;

        }
      )
      .slice(
        0,
        10
      );


  if (!lista.length) {

    contenedor.innerHTML =
      `<div class="empty-state">
        Sin actividad registrada.
      </div>`;

    return;
  }


  contenedor.innerHTML =
    lista.map(
      ([dia, cantidad]) =>
        `

          <div
            style="
              display:flex;
              justify-content:space-between;
              padding:8px 0;
            "
          >

            <span>
              📅 ${escapar(
                dia
              )}
            </span>

            <strong>
              ${cantidad}
            </strong>

          </div>

        `
    ).join("");

}


/* =========================================================
   BÚSQUEDAS / FILTROS
   ========================================================= */

$("offerSearch")
  ?.addEventListener(
    "input",
    renderOfertas
  );


$("offerCategoryFilter")
  ?.addEventListener(
    "change",
    renderOfertas
  );


$("couponSearch")
  ?.addEventListener(
    "input",
    renderCupones
  );


$("couponTypeFilter")
  ?.addEventListener(
    "change",
    renderCupones
  );


$("userSearch")
  ?.addEventListener(
    "input",
    renderUsuarios
  );


/* =========================================================
   MODALES
   ========================================================= */

function abrirModal(
  id
) {

  const modal =
    $(id);

  if (modal) {

    modal.style.display =
      "flex";

  }

}


function cerrarModal(
  id
) {

  const modal =
    $(id);

  if (modal) {

    modal.style.display =
      "none";

  }

}


document
  .querySelectorAll(
    "[data-close]"
  )
  .forEach(
    (boton) => {

      boton.addEventListener(
        "click",
        () => {

          cerrarModal(
            boton.dataset.close
          );

        }
      );

    }
  );


document
  .querySelectorAll(
    ".modal-overlay"
  )
  .forEach(
    (modal) => {

      modal.addEventListener(
        "click",
        (event) => {

          if (
            event.target ===
            modal
          ) {

            modal.style.display =
              "none";

          }

        }
      );

    }
  );


/* =========================================================
   LIMPIAR FORMULARIOS
   ========================================================= */

function limpiarOfertaForm() {

  ofertaEditando =
    null;

  $("offerId").value =
    "";

  $("offerTitle").value =
    "";

  $("offerOldPrice").value =
    "";

  $("offerPrice").value =
    "";

  $("offerCategory").value =
    "";

  $("offerClicks").value =
    "0";

  $("offerLink").value =
    "";

  $("offerImage").value =
    "";

  $("offerImagePreview").innerHTML =
    "";

  $("offerModalTitle").textContent =
    "Nueva oferta";

}


function limpiarCuponForm() {

  cuponEditando =
    null;

  $("couponId").value =
    "";

  $("couponCode").value =
    "";

  $("couponType").value =
    "relampago";

  $("couponDiscount").value =
    "";

  $("couponMinimum").value =
    "";

  $("couponMaximum").value =
    "";

  $("couponCopies").value =
    "0";

  $("couponStatus").value =
    "activo";

  $("couponDescription").value =
    "";

  $("couponModalTitle").textContent =
    "Nuevo cupón";

}


/* =========================================================
   CERRAR MODAL CON ESC
   ========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "Escape"
    ) {

      cerrarModal(
        "offerModal"
      );

      cerrarModal(
        "couponModal"
      );

    }

  }
);


/* =========================================================
   FUNCIONES AUXILIARES
   ========================================================= */

function actualizarNumero(
  id,
  valor
) {

  const elemento =
    $(id);

  if (elemento) {

    elemento.textContent =
      numero(
        valor
      ).toLocaleString(
        "es-MX"
      );

  }

}


function obtenerFecha(
  valor
) {

  if (!valor) {
    return 0;
  }

  try {

    if (
      typeof valor.toDate ===
      "function"
    ) {

      return valor.toDate()
        .getTime();

    }


    const fecha =
      new Date(
        valor
      );

    const tiempo =
      fecha.getTime();


    return Number.isNaN(
      tiempo
    )
      ? 0
      : tiempo;

  } catch {

    return 0;

  }

}


function renderErrorTabla(
  id,
  colspan,
  mensaje
) {

  const tbody =
    $(id);

  if (!tbody) {
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td
        colspan="${colspan}"
        class="table-loading"
      >
        ${escapar(
          mensaje
        )}
      </td>
    </tr>
  `;

}


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log(
      "⚡ ADMIN PRO cargado."
    );

    /*
     * Si Firebase tarda en responder,
     * la pantalla de carga permanece.
     * onAuthStateChanged será quien
     * finalmente muestre Login o Admin.
     */

  }
);


/* =========================================================
   EXPORTACIÓN GLOBAL
   ========================================================= */

window.adminPRO = {

  auth,

  db,

  cargarTodo,

  cargarOfertas,

  cargarCupones,

  cargarUsuarios,

  cargarEstadisticas,

  cambiarSeccion

};


console.log(
  "⚡ El Patrón de las Ofertas — Admin PRO listo."
);