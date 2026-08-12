/* =========================================================
   EL PATRÓN DE LAS OFERTAS
   ADMIN PRO + PÁGINA PRINCIPAL
========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   🔥 CONFIGURACIÓN FIREBASE

   PEGA AQUÍ LA CONFIGURACIÓN DE TU PROYECTO FIREBASE.

   Firebase Console
   → Configuración del proyecto
   → Tus aplicaciones
   → Configuración del SDK
========================================================= */

const firebaseConfig = {

  apiKey: "PEGA_AQUI_TU_API_KEY",

  authDomain:
    "PEGA_AQUI_TU_PROYECTO.firebaseapp.com",

  projectId:
    "PEGA_AQUI_TU_PROJECT_ID",

  storageBucket:
    "PEGA_AQUI_TU_PROJECT_ID.appspot.com",

  messagingSenderId:
    "PEGA_AQUI_TU_SENDER_ID",

  appId:
    "PEGA_AQUI_TU_APP_ID"

};


/* =========================================================
   FIREBASE
========================================================= */

const firebaseApp =
  initializeApp(
    firebaseConfig
  );

const auth =
  getAuth(
    firebaseApp
  );

const db =
  getFirestore(
    firebaseApp
  );


/* =========================================================
   ESTADO
========================================================= */

let currentAdmin = null;

let users = [];
let coupons = [];
let offers = [];
let purchases = [];
let dailyStats = [];


/* =========================================================
   HELPERS DOM
========================================================= */

const $ =
  selector =>
    document.querySelector(
      selector
    );

const $$ =
  selector =>
    document.querySelectorAll(
      selector
    );


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  iniciar
);


function iniciar() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const esAdmin =
    params.get("admin") === "1";


  if (esAdmin) {

    $("#publicApp")
      ?.classList
      .add("hidden");

    $("#adminApp")
      ?.classList
      .remove("hidden");

    iniciarAdmin();

  } else {

    cargarPaginaPublica();

  }

}


/* =========================================================
   ADMIN
========================================================= */

function iniciarAdmin() {

  configurarNavegacion();

  configurarEventos();

  observarAdministrador();

}


/* =========================================================
   AUTENTICACIÓN
========================================================= */

function observarAdministrador() {

  onAuthStateChanged(
    auth,
    async user => {

      if (!user) {

        mostrarLogin();

        return;
      }


      try {

        const usuarioRef =
          doc(
            db,
            "usuarios",
            user.uid
          );

        const snapshot =
          await getDoc(
            usuarioRef
          );


        if (!snapshot.exists()) {

          mostrarLogin(
            "Tu usuario no tiene perfil en la colección usuarios."
          );

          await signOut(auth);

          return;
        }


        const data =
          snapshot.data();


        const rol =
          String(
            data.rol ||
            data.role ||
            ""
          )
            .toLowerCase()
            .trim();


        if (
          rol !== "admin" &&
          rol !== "administrador"
        ) {

          mostrarLogin(
            "Tu cuenta no tiene permisos de administrador."
          );

          await signOut(auth);

          return;
        }


        currentAdmin = {

          ...data,

          uid:
            user.uid,

          email:
            user.email ||
            data.email ||
            ""

        };


        $("#adminEmail")
          .textContent =
            currentAdmin.email;


        mostrarPanelAdmin();

        await cargarTodo();


      } catch (error) {

        console.error(
          "Error verificando administrador:",
          error
        );

        mostrarLogin(
          "No se pudo verificar tu acceso."
        );

      }

    }
  );

}


/* =========================================================
   LOGIN
========================================================= */

function mostrarLogin(
  mensaje = ""
) {

  $("#adminLogin")
    ?.classList
    .remove("hidden");

  $("#adminPanel")
    ?.classList
    .add("hidden");


  if (mensaje) {

    $("#loginMessage")
      .textContent =
        mensaje;

  }

}


function mostrarPanelAdmin() {

  $("#adminLogin")
    ?.classList
    .add("hidden");

  $("#adminPanel")
    ?.classList
    .remove("hidden");

}


$("#loginForm")
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const email =
        $("#loginEmail")
          .value
          .trim();

      const password =
        $("#loginPassword")
          .value;


      $("#loginMessage")
        .textContent =
          "Verificando acceso...";


      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      } catch (error) {

        console.error(
          error
        );

        $("#loginMessage")
          .textContent =
            traducirErrorLogin(
              error.code
            );

      }

    }
  );


function traducirErrorLogin(
  code
) {

  const errores = {

    "auth/invalid-credential":
      "Correo o contraseña incorrectos.",

    "auth/invalid-email":
      "El correo no es válido.",

    "auth/user-disabled":
      "Esta cuenta está deshabilitada.",

    "auth/too-many-requests":
      "Demasiados intentos. Espera un momento."

  };


  return errores[code] ||
    "No se pudo iniciar sesión.";

}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function configurarNavegacion() {

  $$(".nav-button")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            cambiarSeccion(
              button.dataset.section
            );

          }
        );

      }
    );

}


function cambiarSeccion(
  section
) {

  $$(".nav-button")
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.section ===
            section
        );

      }
    );


  $$(".admin-section")
    .forEach(
      sectionElement => {

        sectionElement.classList.remove(
          "active-section"
        );

      }
    );


  $(
    `#section-${section}`
  )
    ?.classList
    .add(
      "active-section"
    );


  const titles = {

    dashboard:
      "Dashboard",

    usuarios:
      "Usuarios",

    cupones:
      "Cupones",

    ofertas:
      "Ofertas",

    compras:
      "Compras",

    estadisticas:
      "Estadísticas"

  };


  $("#pageTitle")
    .textContent =
      titles[section] ||
      "Admin PRO";

}


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventos() {

  $("#logoutButton")
    ?.addEventListener(
      "click",
      cerrarSesion
    );


  $("#refreshButton")
    ?.addEventListener(
      "click",
      async () => {

        mostrarToast(
          "🔄 Actualizando...",
          "success"
        );

        await cargarTodo();

        mostrarToast(
          "✅ Datos actualizados",
          "success"
        );

      }
    );


  $("#newCouponButton")
    ?.addEventListener(
      "click",
      () => {

        limpiarFormularioCupon();

        $("#couponFormPanel")
          ?.classList
          .remove("hidden");

      }
    );


  $("#cancelCouponButton")
    ?.addEventListener(
      "click",
      () => {

        $("#couponFormPanel")
          ?.classList
          .add("hidden");

      }
    );


  $("#couponForm")
    ?.addEventListener(
      "submit",
      guardarCupon
    );


  $("#newOfferButton")
    ?.addEventListener(
      "click",
      () => {

        limpiarFormularioOferta();

        $("#offerFormPanel")
          ?.classList
          .remove("hidden");

      }
    );


  $("#cancelOfferButton")
    ?.addEventListener(
      "click",
      () => {

        $("#offerFormPanel")
          ?.classList
          .add("hidden");

      }
    );


  $("#offerForm")
    ?.addEventListener(
      "submit",
      guardarOferta
    );


  $("#userSearch")
    ?.addEventListener(
      "input",
      renderUsuarios
    );


  $("#purchaseFilter")
    ?.addEventListener(
      "change",
      renderCompras
    );


  $("#closeModal")
    ?.addEventListener(
      "click",
      cerrarModal
    );


  $("#imageModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "imageModal"
        ) {

          cerrarModal();

        }

      }
    );

}


/* =========================================================
   CARGAR TODO
========================================================= */

async function cargarTodo() {

  await Promise.all([
    cargarUsuarios(),
    cargarCupones(),
    cargarOfertas(),
    cargarCompras(),
    cargarEstadisticas()
  ]);

  actualizarDashboard();

}


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


    users = [];


    snapshot.forEach(
      item => {

        users.push({
          id: item.id,
          ...item.data()
        });

      }
    );


    users.sort(
      (a, b) =>
        Number(
          b.ahorroTotal || 0
        ) -
        Number(
          a.ahorroTotal || 0
        )
    );


    renderUsuarios();

  } catch (error) {

    console.error(
      "Error usuarios:",
      error
    );

  }

}


function renderUsuarios() {

  const tbody =
    $("#usersTable");


  if (!tbody) {
    return;
  }


  const search =
    String(
      $("#userSearch")
        ?.value ||
      ""
    )
      .toLowerCase()
      .trim();


  const filtered =
    users.filter(
      user => {

        const texto = `

          ${user.nombre || ""}

          ${user.email || ""}

          ${user.estado || ""}

        `.toLowerCase();


        return texto.includes(
          search
        );

      }
    );


  tbody.innerHTML = "";


  if (!filtered.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          No hay usuarios.
        </td>
      </tr>
    `;

    return;
  }


  filtered.forEach(
    (user, index) => {

      const tr =
        document.createElement(
          "tr"
        );


      tr.innerHTML = `

        <td>

          <div class="user-name">
            ${escaparHtml(
              user.nombre ||
              "Usuario"
            )}
          </div>

          <div class="user-email">
            UID:
            ${escaparHtml(
              user.uid ||
              user.id
            )}
          </div>

        </td>

        <td>
          ${escaparHtml(
            user.email ||
            ""
          )}
        </td>

        <td>
          🇲🇽
          ${escaparHtml(
            user.estado ||
            "No indicado"
          )}
        </td>

        <td>
          ${formatearPrecio(
            user.ahorroTotal
          )}
        </td>

        <td>
          ${Number(
            user.compras ||
            0
          )}
        </td>

        <td>
          ${Number(
            user.cuponesUsados ||
            0
          )}
        </td>

        <td>
          <span class="rank-badge">
            #${index + 1}
          </span>
        </td>

      `;


      tbody.appendChild(
        tr
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


    coupons = [];


    snapshot.forEach(
      item => {

        coupons.push({
          id: item.id,
          ...item.data()
        });

      }
    );


    coupons.sort(
      (a, b) =>
        Number(
          b.copias || 0
        ) -
        Number(
          a.copias || 0
        )
    );


    renderCupones();


  } catch (error) {

    console.error(
      "Error cupones:",
      error
    );

  }

}


function renderCupones() {

  const tbody =
    $("#couponsTable");


  if (!tbody) {
    return;
  }


  tbody.innerHTML = "";


  coupons.forEach(
    coupon => {

      const tr =
        document.createElement(
          "tr"
        );


      const codigo =
        String(
          coupon.codigo ||
          coupon.code ||
          ""
        )
          .toUpperCase();


      const activo =
        coupon.activo !== false &&
        String(
          coupon.estado ||
          ""
        )
          .toLowerCase() !==
          "agotado";


      tr.innerHTML = `

        <td>
          <strong>
            ${escaparHtml(
              codigo
            )}
          </strong>
        </td>

        <td>
          ${obtenerNombreTipo(
            coupon.tipo
          )}
        </td>

        <td>
          ${escaparHtml(
            coupon.descuento ||
            coupon.monto ||
            coupon.valor ||
            ""
          )}
        </td>

        <td>
          ${
            coupon.compraMinima
              ? formatearPrecio(
                  coupon.compraMinima
                )
              : "-"
          }
        </td>

        <td>
          ${
            coupon.tope
              ? formatearPrecio(
                  coupon.tope
                )
              : "-"
          }
        </td>

        <td>
          🔥
          ${Number(
            coupon.copias ||
            0
          )}
        </td>

        <td>

          <span
            class="status ${
              activo
                ? "approved"
                : "rejected"
            }"
          >
            ${
              activo
                ? "ACTIVO"
                : "AGOTADO"
            }
          </span>

        </td>

        <td>

          <button
            class="small-button"
            data-edit-coupon="${coupon.id}"
          >
            ✏️
          </button>

          <button
            class="danger-button"
            data-delete-coupon="${coupon.id}"
          >
            🗑️
          </button>

        </td>

      `;


      tr
        .querySelector(
          `[data-edit-coupon="${coupon.id}"]`
        )
        ?.addEventListener(
          "click",
          () =>
            editarCupon(
              coupon.id
            )
        );


      tr
        .querySelector(
          `[data-delete-coupon="${coupon.id}"]`
        )
        ?.addEventListener(
          "click",
          () =>
            eliminarCupon(
              coupon.id
            )
        );


      tbody.appendChild(
        tr
      );

    }
  );

}


async function guardarCupon(
  event
) {

  event.preventDefault();


  const id =
    $("#couponId")
      .value
      .trim();


  const codigo =
    $("#couponCode")
      .value
      .trim()
      .toUpperCase();


  if (!codigo) {

    mostrarToast(
      "❌ Escribe el código.",
      "error"
    );

    return;
  }


  const data = {

    codigo,

    tipo:
      $("#couponType")
        .value,

    descuento:
      $("#couponDiscount")
        .value
        .trim(),

    compraMinima:
      Number(
        $("#couponMinimum")
          .value ||
        0
      ),

    tope:
      Number(
        $("#couponMaximum")
          .value ||
        0
      ),

    link:
      $("#couponLink")
        .value
        .trim(),

    activo:
      $("#couponActive")
        .checked,

    porAgotarse:
      $("#couponWarning")
        .checked,

    actualizado:
      serverTimestamp()

  };


  try {

    if (id) {

      await updateDoc(
        doc(
          db,
          "cupones",
          id
        ),
        data
      );


      mostrarToast(
        "✅ Cupón actualizado",
        "success"
      );

    } else {

      await addDoc(
        collection(
          db,
          "cupones"
        ),
        {
          ...data,

          copias: 0,

          creado:
            serverTimestamp()

        }
      );


      mostrarToast(
        "✅ Cupón creado",
        "success"
      );

    }


    $("#couponFormPanel")
      .classList
      .add("hidden");


    await cargarCupones();


    cargarPaginaPublica();

  } catch (error) {

    console.error(
      error
    );

    mostrarToast(
      "❌ No se pudo guardar el cupón.",
      "error"
    );

  }

}


function editarCupon(
  id
) {

  const coupon =
    coupons.find(
      item =>
        item.id ===
        id
    );


  if (!coupon) {
    return;
  }


  $("#couponId")
    .value =
      coupon.id;


  $("#couponCode")
    .value =
      String(
        coupon.codigo ||
        coupon.code ||
        ""
      )
        .toUpperCase();


  $("#couponType")
    .value =
      normalizarTipo(
        coupon.tipo
      );


  $("#couponDiscount")
    .value =
      coupon.descuento ||
      coupon.monto ||
      coupon.valor ||
      "";


  $("#couponMinimum")
    .value =
      Number(
        coupon.compraMinima ||
        0
      );


  $("#couponMaximum")
    .value =
      Number(
        coupon.tope ||
        0
      );


  $("#couponLink")
    .value =
      coupon.link ||
      "";


  $("#couponActive")
    .checked =
      coupon.activo !== false;


  $("#couponWarning")
    .checked =
      coupon.porAgotarse === true;


  $("#couponFormPanel")
    .classList
    .remove("hidden");


  $("#couponFormPanel")
    .scrollIntoView({
      behavior:
        "smooth"
    });

}


async function eliminarCupon(
  id
) {

  const coupon =
    coupons.find(
      item =>
        item.id ===
        id
    );


  if (!coupon) {
    return;
  }


  const codigo =
    String(
      coupon.codigo ||
      ""
    )
      .toUpperCase();


  if (
    !confirm(
      `¿Eliminar el cupón ${codigo}?`
    )
  ) {

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


    mostrarToast(
      "🗑️ Cupón eliminado",
      "success"
    );


    await cargarCupones();


    cargarPaginaPublica();

  } catch (error) {

    console.error(
      error
    );

    mostrarToast(
      "❌ No se pudo eliminar.",
      "error"
    );

  }

}


/* =========================================================
   OFERTAS
========================================================= */

async function cargarOfertas() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "ofertas"
        )
      );


    offers = [];


    snapshot.forEach(
      item => {

        offers.push({
          id: item.id,
          ...item.data()
        });

      }
    );


    offers.sort(
      (a, b) =>
        fechaValor(
          b.creado
        ) -
        fechaValor(
          a.creado
        )
    );


    renderOfertas();

  } catch (error) {

    console.error(
      "Error ofertas:",
      error
    );

  }

}


function renderOfertas() {

  const tbody =
    $("#offersTable");


  if (!tbody) {
    return;
  }


  tbody.innerHTML = "";


  offers.forEach(
    offer => {

      const antes =
        Number(
          offer.precioAntes ||
          0
        );


      const actual =
        Number(
          offer.precioActual ||
          offer.precioFinal ||
          0
        );


      const ahorro =
        Math.max(
          0,
          antes -
          actual
        );


      const tr =
        document.createElement(
          "tr"
        );


      tr.innerHTML = `

        <td>

          ${
            offer.imagen
              ? `
                <img
                  class="offer-thumb"
                  src="${escaparHtml(
                    offer.imagen
                  )}"
                  alt=""
                >
              `
              : "🛍️"
          }

        </td>

        <td>
          <strong>
            ${escaparHtml(
              offer.titulo ||
              "Oferta"
            )}
          </strong>
        </td>

        <td>
          ${formatearPrecio(
            antes
          )}
        </td>

        <td>
          ${formatearPrecio(
            actual
          )}
        </td>

        <td>
          ${formatearPrecio(
            ahorro
          )}
        </td>

        <td>
          👆
          ${Number(
            offer.clics ||
            0
          )}
        </td>

        <td>

          <button
            class="small-button"
            data-edit-offer="${offer.id}"
          >
            ✏️
          </button>

          <button
            class="danger-button"
            data-delete-offer="${offer.id}"
          >
            🗑️
          </button>

        </td>

      `;


      tr
        .querySelector(
          `[data-edit-offer="${offer.id}"]`
        )
        ?.addEventListener(
          "click",
          () =>
            editarOferta(
              offer.id
            )
        );


      tr
        .querySelector(
          `[data-delete-offer="${offer.id}"]`
        )
        ?.addEventListener(
          "click",
          () =>
            eliminarOferta(
              offer.id
            )
        );


      tbody.appendChild(
        tr
      );

    }
  );

}


async function guardarOferta(
  event
) {

  event.preventDefault();


  const id =
    $("#offerId")
      .value
      .trim();


  const data = {

    titulo:
      $("#offerTitle")
        .value
        .trim(),

    precioAntes:
      Number(
        $("#offerOldPrice")
          .value ||
        0
      ),

    precioActual:
      Number(
        $("#offerCurrentPrice")
          .value ||
        0
      ),

    imagen:
      $("#offerImage")
        .value
        .trim(),

    link:
      $("#offerLink")
        .value
        .trim(),

    actualizado:
      serverTimestamp()

  };


  try {

    if (id) {

      await updateDoc(
        doc(
          db,
          "ofertas",
          id
        ),
        data
      );


      mostrarToast(
        "✅ Oferta actualizada",
        "success"
      );

    } else {

      await addDoc(
        collection(
          db,
          "ofertas"
        ),
        {

          ...data,

          clics: 0,

          creado:
            serverTimestamp()

        }
      );


      mostrarToast(
        "✅ Oferta creada",
        "success"
      );

    }


    $("#offerFormPanel")
      .classList
      .add("hidden");


    await cargarOfertas();


    cargarPaginaPublica();

  } catch (error) {

    console.error(
      error
    );

    mostrarToast(
      "❌ No se pudo guardar la oferta.",
      "error"
    );

  }

}


function editarOferta(
  id
) {

  const offer =
    offers.find(
      item =>
        item.id ===
        id
    );


  if (!offer) {
    return;
  }


  $("#offerId")
    .value =
      offer.id;


  $("#offerTitle")
    .value =
      offer.titulo ||
      "";


  $("#offerOldPrice")
    .value =
      Number(
        offer.precioAntes ||
        0
      );


  $("#offerCurrentPrice")
    .value =
      Number(
        offer.precioActual ||
        offer.precioFinal ||
        0
      );


  $("#offerImage")
    .value =
      offer.imagen ||
      "";


  $("#offerLink")
    .value =
      offer.link ||
      "";


  $("#offerFormPanel")
    .classList
    .remove("hidden");


  $("#offerFormPanel")
    .scrollIntoView({
      behavior:
        "smooth"
    });

}


async function eliminarOferta(
  id
) {

  if (
    !confirm(
      "¿Eliminar esta oferta?"
    )
  ) {

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


    mostrarToast(
      "🗑️ Oferta eliminada",
      "success"
    );


    await cargarOfertas();


    cargarPaginaPublica();

  } catch (error) {

    console.error(
      error
    );

    mostrarToast(
      "❌ No se pudo eliminar.",
      "error"
    );

  }

}


/* =========================================================
   COMPRAS
========================================================= */

async function cargarCompras() {

  try {

    let snapshot;


    try {

      snapshot =
        await getDocs(
          query(
            collection(
              db,
              "compras"
            ),
            orderBy(
              "creado",
              "desc"
            )
          )
        );

    } catch {

      snapshot =
        await getDocs(
          collection(
            db,
            "compras"
          )
        );

    }


    purchases = [];


    snapshot.forEach(
      item => {

        purchases.push({
          id: item.id,
          ...item.data()
        });

      }
    );


    purchases.sort(
      (a, b) =>
        fechaValor(
          b.creado
        ) -
        fechaValor(
          a.creado
        )
    );


    renderCompras();

  } catch (error) {

    console.error(
      "Error compras:",
      error
    );

  }

}


function renderCompras() {

  const container =
    $("#purchasesContainer");


  if (!container) {
    return;
  }


  const filtro =
    $("#purchaseFilter")
      ?.value ||
    "todas";


  let lista =
    purchases;


  if (
    filtro !==
    "todas"
  ) {

    lista =
      purchases.filter(
        purchase =>
          normalizarEstadoCompra(
            purchase.estado
          ) ===
          filtro
      );

  }


  container.innerHTML = "";


  if (!lista.length) {

    container.innerHTML = `
      <div class="panel" style="padding:25px">
        🛒 No hay compras para este filtro.
      </div>
    `;

    return;
  }


  lista.forEach(
    purchase => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "purchase-card";


      const estado =
        normalizarEstadoCompra(
          purchase.estado
        );


      const estadoTexto = {

        pendiente:
          "PENDIENTE",

        aprobada:
          "VERIFICADA",

        rechazada:
          "RECHAZADA"

      }[estado] ||
        "PENDIENTE";


      card.innerHTML = `

        <div class="purchase-top">

          <div class="purchase-info">

            <h3>
              ${escaparHtml(
                purchase.producto ||
                "Compra"
              )}
            </h3>

            <p>
              👤
              ${escaparHtml(
                purchase.usuarioNombre ||
                "Usuario"
              )}
            </p>

            <p>
              📧
              ${escaparHtml(
                purchase.usuarioEmail ||
                ""
              )}
            </p>

            <p>
              💰 Precio:
              ${formatearPrecio(
                purchase.precio
              )}
            </p>

            <p>
              💵 Ahorro:
              <strong>
                ${formatearPrecio(
                  purchase.ahorro
                )}
              </strong>
            </p>

            ${
              purchase.cupon
                ? `
                  <p>
                    🎟️ Cupón:
                    <strong>
                      ${escaparHtml(
                        String(
                          purchase.cupon
                        )
                          .toUpperCase()
                      )}
                    </strong>
                  </p>
                `
                : ""
            }

          </div>


          <span
            class="status ${
              estado === "aprobada"
                ? "approved"
                : estado === "rechazada"
                  ? "rejected"
                  : "pending"
            }"
          >
            ${estadoTexto}
          </span>

        </div>


        ${
          purchase.captura
            ? `
              <img
                class="purchase-screenshot"
                src="${escaparHtml(
                  purchase.captura
                )}"
                alt="Captura"
                data-image="${escaparHtml(
                  purchase.captura
                )}"
              >
            `
            : `
              <div
                style="
                  height:250px;
                  display:grid;
                  place-items:center;
                  background:#eee;
                  font-size:50px;
                "
              >
                🧾
              </div>
            `
        }


        ${
          estado === "pendiente"
            ? `
              <div class="purchase-bottom">

                <div class="purchase-actions">

                  <button
                    class="success-button"
                    data-approve="${purchase.id}"
                  >
                    ✅ APROBAR
                  </button>

                  <button
                    class="danger-button"
                    data-reject="${purchase.id}"
                  >
                    ❌ RECHAZAR
                  </button>

                </div>

              </div>
            `
            : ""
        }

      `;


      card
        .querySelector(
          "[data-image]"
        )
        ?.addEventListener(
          "click",
          event =>
            abrirModalImagen(
              event.currentTarget
                .dataset
                .image
            )
        );


      card
        .querySelector(
          `[data-approve="${purchase.id}"]`
        )
        ?.addEventListener(
          "click",
          () =>
            aprobarCompra(
              purchase.id
            )
        );


      card
        .querySelector(
          `[data-reject="${purchase.id}"]`
        )
        ?.addEventListener(
          "click",
          () =>
            rechazarCompra(
              purchase.id
            )
        );


      container.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   APROBAR COMPRA
========================================================= */

async function aprobarCompra(
  purchaseId
) {

  const purchase =
    purchases.find(
      item =>
        item.id ===
        purchaseId
    );


  if (!purchase) {
    return;
  }


  if (
    normalizarEstadoCompra(
      purchase.estado
    ) !==
    "pendiente"
  ) {

    mostrarToast(
      "⚠️ Esta compra ya fue procesada.",
      "error"
    );

    return;
  }


  if (
    !confirm(
      "¿Confirmar esta compra como VERIFICADA?"
    )
  ) {

    return;

  }


  try {

    const uid =
      purchase.uid;


    if (!uid) {

      throw new Error(
        "La compra no tiene UID."
      );

    }


    await updateDoc(
      doc(
        db,
        "compras",
        purchaseId
      ),
      {

        estado:
          "aprobada",

        verificadoPor:
          currentAdmin.uid,

        verificadoPorEmail:
          currentAdmin.email,

        verificadoEn:
          serverTimestamp(),

        actualizado:
          serverTimestamp()

      }
    );


    const ahorro =
      Math.max(
        0,
        Number(
          purchase.ahorro ||
          0
        )
      );


    const tieneCupon =
      Boolean(
        String(
          purchase.cupon ||
          ""
        )
          .trim()
      );


    const userRef =
      doc(
        db,
        "usuarios",
        uid
      );


    const userSnapshot =
      await getDoc(
        userRef
      );


    if (
      userSnapshot.exists()
    ) {

      const updateData = {

        ahorroTotal:
          increment(
            ahorro
          ),

        compras:
          increment(
            1
          ),

        actualizado:
          serverTimestamp()

      };


      if (
        tieneCupon
      ) {

        updateData.cuponesUsados =
          increment(
            1
          );

      }


      await updateDoc(
        userRef,
        updateData
      );

    } else {

      await setDoc(
        userRef,
        {

          uid,

          nombre:
            purchase.usuarioNombre ||
            "Usuario",

          email:
            purchase.usuarioEmail ||
            "",

          ahorroTotal:
            ahorro,

          compras:
            1,

          cuponesUsados:
            tieneCupon
              ? 1
              : 0,

          creado:
            serverTimestamp(),

          actualizado:
            serverTimestamp()

        },
        {
          merge: true
        }
      );

    }


    await setDoc(
      doc(
        db,
        "estadisticas",
        "general"
      ),
      {

        comprasAprobadas:
          increment(1),

        ahorroGenerado:
          increment(
            ahorro
          ),

        actualizado:
          serverTimestamp()

      },
      {
        merge: true
      }
    );


    const fecha =
      obtenerFechaLocal();


    await setDoc(
      doc(
        db,
        "estadisticas_diarias",
        fecha
      ),
      {

        fecha,

        comprasAprobadas:
          increment(1),

        ahorroGenerado:
          increment(
            ahorro
          ),

        actualizado:
          serverTimestamp()

      },
      {
        merge: true
      }
    );


    mostrarToast(
      "✅ Compra aprobada y usuario actualizado.",
      "success"
    );


    await cargarTodo();

  } catch (error) {

    console.error(
      "Error aprobando compra:",
      error
    );


    mostrarToast(
      "❌ No se pudo aprobar la compra.",
      "error"
    );

  }

}


/* =========================================================
   RECHAZAR COMPRA
========================================================= */

async function rechazarCompra(
  purchaseId
) {

  if (
    !confirm(
      "¿Rechazar esta compra?"
    )
  ) {

    return;

  }


  try {

    await updateDoc(
      doc(
        db,
        "compras",
        purchaseId
      ),
      {

        estado:
          "rechazada",

        verificadoPor:
          currentAdmin.uid,

        verificadoPorEmail:
          currentAdmin.email,

        verificadoEn:
          serverTimestamp(),

        actualizado:
          serverTimestamp()

      }
    );


    mostrarToast(
      "❌ Compra rechazada.",
      "success"
    );


    await cargarCompras();

    actualizarDashboard();

  } catch (error) {

    console.error(
      error
    );


    mostrarToast(
      "❌ No se pudo rechazar.",
      "error"
    );

  }

}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

async function cargarEstadisticas() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "estadisticas_diarias"
        )
      );


    dailyStats = [];


    snapshot.forEach(
      item => {

        dailyStats.push({
          id: item.id,
          ...item.data()
        });

      }
    );


    dailyStats.sort(
      (a, b) =>
        String(
          a.fecha ||
          a.id
        )
          .localeCompare(
            String(
              b.fecha ||
              b.id
            )
          )
    );

  } catch (error) {

    console.error(
      "Error estadísticas:",
      error
    );

  }

}


/* =========================================================
   DASHBOARD
========================================================= */

function actualizarDashboard() {

  setText(
    "#statUsers",
    users.length
  );

  setText(
    "#statCoupons",
    coupons.length
  );

  setText(
    "#statOffers",
    offers.length
  );

  setText(
    "#statPurchases",
    purchases.length
  );


  const pendientes =
    purchases.filter(
      purchase =>
        normalizarEstadoCompra(
          purchase.estado
        ) ===
        "pendiente"
    ).length;


  setText(
    "#statPending",
    pendientes
  );


  const ahorroTotal =
    purchases
      .filter(
        purchase =>
          normalizarEstadoCompra(
            purchase.estado
          ) ===
          "aprobada"
      )
      .reduce(
        (
          total,
          purchase
        ) =>
          total +
          Number(
            purchase.ahorro ||
            0
          ),
        0
      );


  setText(
    "#statSavings",
    formatearPrecio(
      ahorroTotal
    )
  );


  const copias =
    coupons.reduce(
      (
        total,
        coupon
      ) =>
        total +
        Number(
          coupon.copias ||
          0
        ),
      0
    );


  setText(
    "#statCopies",
    copias
  );


  const clics =
    offers.reduce(
      (
        total,
        offer
      ) =>
        total +
        Number(
          offer.clics ||
          0
        ),
      0
    );


  setText(
    "#statClicks",
    clics
  );


  renderTopCoupons();

  renderTopUsers();

  renderStates();

  renderCharts();

  renderCouponCopies();

}


/* =========================================================
   TOP CUPONES
========================================================= */

function renderTopCoupons() {

  const container =
    $("#topCouponsDashboard");


  if (!container) {
    return;
  }


  const top =
    [...coupons]
      .sort(
        (a, b) =>
          Number(
            b.copias ||
            0
          ) -
          Number(
            a.copias ||
            0
          )
      )
      .slice(
        0,
        5
      );


  container.innerHTML = `
    <div class="ranking-list"></div>
  `;


  const list =
    container.querySelector(
      ".ranking-list"
    );


  top.forEach(
    (coupon, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "ranking-item";


      item.innerHTML = `

        <div class="ranking-left">

          <div class="ranking-position">
            #${index + 1}
          </div>

          <div class="ranking-name">
            ${escaparHtml(
              String(
                coupon.codigo ||
                ""
              )
                .toUpperCase()
            )}
          </div>

        </div>

        <div class="ranking-value">
          ${Number(
            coupon.copias ||
            0
          )} copias
        </div>

      `;


      list.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   TOP USUARIOS
========================================================= */

function renderTopUsers() {

  const containers = [

    $("#topUsersDashboard"),

    $("#rankingStats")

  ];


  const top =
    [...users]
      .sort(
        (a, b) =>
          Number(
            b.ahorroTotal ||
            0
          ) -
          Number(
            a.ahorroTotal ||
            0
          )
      )
      .slice(
        0,
        10
      );


  containers.forEach(
    container => {

      if (!container) {
        return;
      }


      container.innerHTML = `
        <div class="ranking-list"></div>
      `;


      const list =
        container.querySelector(
          ".ranking-list"
        );


      top.forEach(
        (user, index) => {

          const item =
            document.createElement(
              "div"
            );


          item.className =
            "ranking-item";


          item.innerHTML = `

            <div class="ranking-left">

              <div class="ranking-position">
                ${
                  index === 0
                    ? "🥇"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : `#${index + 1}`
                }
              </div>

              <div>

                <div class="ranking-name">
                  ${escaparHtml(
                    user.nombre ||
                    "Usuario"
                  )}
                </div>

                <small>
                  ${Number(
                    user.compras ||
                    0
                  )} compras
                </small>

              </div>

            </div>

            <div class="ranking-value">
              ${formatearPrecio(
                user.ahorroTotal ||
                0
              )}
            </div>

          `;


          list.appendChild(
            item
          );

        }
      );

    }
  );

}


/* =========================================================
   ESTADOS
========================================================= */

function renderStates() {

  const containers = [

    $("#statesDashboard"),

    $("#statesStats")

  ];


  const counts = {};


  users.forEach(
    user => {

      const estado =
        String(
          user.estado ||
          "No indicado"
        )
          .trim();


      counts[estado] =
        (
          counts[estado] ||
          0
        ) + 1;

    }
  );


  const states =
    Object.entries(
      counts
    )
      .sort(
        (a, b) =>
          b[1] -
          a[1]
      );


  const max =
    Math.max(
      1,
      ...states.map(
        item =>
          item[1]
      )
    );


  containers.forEach(
    container => {

      if (!container) {
        return;
      }


      container.innerHTML =
        "";


      states.forEach(
        ([estado, cantidad]) => {

          const item =
            document.createElement(
              "div"
            );


          item.className =
            "bar-item";


          item.innerHTML = `

            <div class="bar-label">

              <span>
                🇲🇽
                ${escaparHtml(
                  estado
                )}
              </span>

              <strong>
                ${cantidad}
              </strong>

            </div>

            <div class="bar-track">

              <div
                class="bar-fill"
                style="width:${
                  (
                    cantidad /
                    max
                  ) * 100
                }%"
              ></div>

            </div>

          `;


          container.appendChild(
            item
          );

        }
      );

    }
  );

}


/* =========================================================
   COPIAS POR CUPÓN
========================================================= */

function renderCouponCopies() {

  const container =
    $("#couponCopiesStats");


  if (!container) {
    return;
  }


  const sorted =
    [...coupons]
      .sort(
        (a, b) =>
          Number(
            b.copias ||
            0
          ) -
          Number(
            a.copias ||
            0
          )
      );


  const max =
    Math.max(
      1,
      ...sorted.map(
        coupon =>
          Number(
            coupon.copias ||
            0
          )
      )
    );


  container.innerHTML =
    "";


  sorted
    .slice(
      0,
      15
    )
    .forEach(
      coupon => {

        const copies =
          Number(
            coupon.copias ||
            0
          );


        const item =
          document.createElement(
            "div"
          );


        item.className =
          "bar-item";


        item.innerHTML = `

          <div class="bar-label">

            <span>
              ${escaparHtml(
                String(
                  coupon.codigo ||
                  ""
                )
                  .toUpperCase()
              )}
            </span>

            <strong>
              ${copies}
            </strong>

          </div>

          <div class="bar-track">

            <div
              class="bar-fill"
              style="width:${
                (
                  copies /
                  max
                ) * 100
              }%"
            ></div>

          </div>

        `;


        container.appendChild(
          item
        );

      }
    );

}


/* =========================================================
   GRÁFICAS
========================================================= */

function renderCharts() {

  dibujarGrafica(
    $("#clicksChart"),
    dailyStats,
    "clics"
  );


  dibujarGrafica(
    $("#clicksChartLarge"),
    dailyStats,
    "clics"
  );

}


function dibujarGrafica(
  canvas,
  data,
  field
) {

  if (!canvas) {
    return;
  }


  const ctx =
    canvas.getContext(
      "2d"
    );


  const width =
    canvas.width;

  const height =
    canvas.height;


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  if (!data.length) {

    ctx.fillStyle =
      "#777";

    ctx.font =
      "16px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "No hay datos todavía",
      width / 2,
      height / 2
    );

    return;
  }


  const valores =
    data.map(
      item =>
        Number(
          item[field] ||
          0
        )
    );


  const max =
    Math.max(
      1,
      ...valores
    );


  const left =
    55;

  const bottom =
    40;

  const top =
    20;

  const right =
    20;


  const chartWidth =
    width -
    left -
    right;

  const chartHeight =
    height -
    top -
    bottom;


  ctx.strokeStyle =
    "#ddd";

  ctx.lineWidth =
    1;


  ctx.beginPath();

  ctx.moveTo(
    left,
    top
  );

  ctx.lineTo(
    left,
    height -
      bottom
  );

  ctx.lineTo(
    width -
      right,
    height -
      bottom
  );

  ctx.stroke();


  ctx.font =
    "11px Arial";

  ctx.fillStyle =
    "#777";

  ctx.textAlign =
    "right";


  for (
    let i = 0;
    i <= 4;
    i++
  ) {

    const y =
      top +
      chartHeight -
      (
        chartHeight *
        i /
        4
      );


    const value =
      Math.round(
        max *
        i /
        4
      );


    ctx.fillText(
      value,
      left - 8,
      y + 4
    );


    ctx.strokeStyle =
      "#eeeeee";


    ctx.beginPath();

    ctx.moveTo(
      left,
      y
    );

    ctx.lineTo(
      width -
        right,
      y
    );

    ctx.stroke();

  }


  ctx.strokeStyle =
    "#171717";

  ctx.lineWidth =
    3;

  ctx.beginPath();


  data.forEach(
    (item, index) => {

      const x =
        left +
        (
          index /
          Math.max(
            1,
            data.length - 1
          )
        ) *
        chartWidth;


      const value =
        Number(
          item[field] ||
          0
        );


      const y =
        top +
        chartHeight -
        (
          value /
          max
        ) *
        chartHeight;


      if (
        index === 0
      ) {

        ctx.moveTo(
          x,
          y
        );

      } else {

        ctx.lineTo(
          x,
          y
        );

      }

    }
  );


  ctx.stroke();


  ctx.fillStyle =
    "#171717";


  data.forEach(
    (item, index) => {

      const x =
        left +
        (
          index /
          Math.max(
            1,
            data.length - 1
          )
        ) *
        chartWidth;


      const value =
        Number(
          item[field] ||
          0
        );


      const y =
        top +
        chartHeight -
        (
          value /
          max
        ) *
        chartHeight;


      ctx.beginPath();

      ctx.arc(
        x,
        y,
        4,
        0,
        Math.PI * 2
      );

      ctx.fill();

    }
  );


  ctx.fillStyle =
    "#777";

  ctx.font =
    "10px Arial";

  ctx.textAlign =
    "center";


  const salto =
    Math.max(
      1,
      Math.ceil(
        data.length /
        7
      )
    );


  data.forEach(
    (item, index) => {

      if (
        index %
        salto !==
        0
      ) {

        return;

      }


      const x =
        left +
        (
          index /
          Math.max(
            1,
            data.length - 1
          )
        ) *
        chartWidth;


      const fecha =
        String(
          item.fecha ||
          item.id ||
          ""
        );


      ctx.fillText(
        fecha.slice(
          5
        ),
        x,
        height -
          15
      );

    }
  );

}


/* =========================================================
   FORMULARIOS
========================================================= */

function limpiarFormularioCupon() {

  $("#couponForm")
    ?.reset();


  $("#couponId")
    .value = "";


  $("#couponActive")
    .checked = true;


  $("#couponWarning")
    .checked = false;

}


function limpiarFormularioOferta() {

  $("#offerForm")
    ?.reset();


  $("#offerId")
    .value = "";

}


/* =========================================================
   MODAL
========================================================= */

function abrirModalImagen(
  url
) {

  $("#modalImage")
    .src =
      url;


  $("#imageModal")
    .classList
    .remove(
      "hidden"
    );

}


function cerrarModal() {

  $("#imageModal")
    .classList
    .add(
      "hidden"
    );


  $("#modalImage")
    .src = "";

}


/* =========================================================
   LOGOUT
========================================================= */

async function cerrarSesion() {

  try {

    await signOut(
      auth
    );

    window.location.href =
      "./index.html";

  } catch (error) {

    console.error(
      error
    );

  }

}


/* =========================================================
   PÁGINA PÚBLICA
========================================================= */

async function cargarPaginaPublica() {

  try {

    const [
      couponSnapshot,
      offerSnapshot
    ] = await Promise.all([

      getDocs(
        collection(
          db,
          "cupones"
        )
      ),

      getDocs(
        collection(
          db,
          "ofertas"
        )
      )

    ]);


    const publicCoupons = [];


    couponSnapshot.forEach(
      item => {

        publicCoupons.push({
          id: item.id,
          ...item.data()
        });

      }
    );


    const publicOffers = [];


    offerSnapshot.forEach(
      item => {

        publicOffers.push({
          id: item.id,
          ...item.data()
        });

      }
    );


    renderPublicCoupons(
      publicCoupons
    );


    renderPublicOffers(
      publicOffers
    );


  } catch (error) {

    console.error(
      "Error página pública:",
      error
    );


    const couponsContainer =
      $("#publicCoupons");


    const offersContainer =
      $("#publicOffers");


    if (couponsContainer) {

      couponsContainer.innerHTML = `
        <div class="public-loading">
          ⚠️ No se pudieron cargar los cupones.
        </div>
      `;

    }


    if (offersContainer) {

      offersContainer.innerHTML = `
        <div class="public-loading">
          ⚠️ No se pudieron cargar las ofertas.
        </div>
      `;

    }

  }

}


function renderPublicCoupons(
  list
) {

  const container =
    $("#publicCoupons");


  if (!container) {
    return;
  }


  const activos =
    list.filter(
      coupon =>
        coupon.activo !== false &&
        String(
          coupon.estado ||
          ""
        )
          .toLowerCase() !==
          "agotado"
    );


  container.innerHTML =
    "";


  if (!activos.length) {

    container.innerHTML = `
      <div class="public-loading">
        🎟️ No hay cupones activos en este momento.
      </div>
    `;

    return;
  }


  activos.forEach(
    coupon => {

      const article =
        document.createElement(
          "article"
        );


      article.className =
        "public-coupon";


      const codigo =
        String(
          coupon.codigo ||
          coupon.code ||
          ""
        )
          .toUpperCase();


      article.innerHTML = `

        <div class="public-coupon-code">
          ${escaparHtml(
            codigo
          )}
        </div>

        <div class="public-coupon-type">
          ${obtenerNombreTipo(
            coupon.tipo
          )}
        </div>

        <div class="public-coupon-info">

          ${
            coupon.descuento
              ? `🎁 ${escaparHtml(
                  coupon.descuento
                )}<br>`
              : ""
          }

          ${
            coupon.compraMinima
              ? `🛒 Mínimo:
                  ${formatearPrecio(
                    coupon.compraMinima
                  )}<br>`
              : ""
          }

          ${
            coupon.tope
              ? `💰 Tope:
                  ${formatearPrecio(
                    coupon.tope
                  )}`
              : ""
          }

        </div>


        <button
          class="public-coupon-button"
          data-copy-coupon="${coupon.id}"
        >
          📋 COPIAR CUPÓN
        </button>

      `;


      article
        .querySelector(
          "[data-copy-coupon]"
        )
        ?.addEventListener(
          "click",
          () =>
            copiarCuponPublico(
              coupon
            )
        );


      container.appendChild(
        article
      );

    }
  );

}


async function copiarCuponPublico(
  coupon
) {

  const codigo =
    String(
      coupon.codigo ||
      coupon.code ||
      ""
    )
      .toUpperCase();


  try {

    await navigator.clipboard.writeText(
      codigo
    );


    try {

      await updateDoc(
        doc(
          db,
          "cupones",
          coupon.id
        ),
        {
          copias:
            increment(1)
        }
      );

    } catch (error) {

      console.warn(
        "No se pudo incrementar copias:",
        error
      );

    }


    mostrarToast(
      `✅ Cupón ${codigo} copiado`,
      "success"
    );


    if (coupon.link) {

      setTimeout(
        () => {

          window.location.href =
            coupon.link;

        },
        250
      );

    }

  } catch (error) {

    console.error(
      error
    );


    mostrarToast(
      "❌ No se pudo copiar el cupón.",
      "error"
    );

  }

}


function renderPublicOffers(
  list
) {

  const container =
    $("#publicOffers");


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  if (!list.length) {

    container.innerHTML = `
      <div class="public-loading">
        🔥 No hay ofertas publicadas todavía.
      </div>
    `;

    return;
  }


  list
    .slice(
      0,
      20
    )
    .forEach(
      offer => {

        const article =
          document.createElement(
            "article"
          );


        article.className =
          "public-offer";


        const antes =
          Number(
            offer.precioAntes ||
            0
          );


        const actual =
          Number(
            offer.precioActual ||
            offer.precioFinal ||
            0
          );


        article.innerHTML = `

          ${
            offer.imagen
              ? `
                <img
                  src="${escaparHtml(
                    offer.imagen
                  )}"
                  alt="${escaparHtml(
                    offer.titulo ||
                    "Oferta"
                  )}"
                >
              `
              : `
                <div
                  style="
                    height:190px;
                    display:grid;
                    place-items:center;
                    background:#f5f5f5;
                    border-radius:12px;
                    font-size:55px;
                  "
                >
                  🔥
                </div>
              `
          }


          <h3>
            ${escaparHtml(
              offer.titulo ||
              "Oferta"
            )}
          </h3>


          ${
            antes
              ? `
                <div class="public-old-price">
                  ${formatearPrecio(
                    antes
                  )}
                </div>
              `
              : ""
          }


          <div class="public-price">
            ${formatearPrecio(
              actual
            )}
          </div>


          ${
            offer.link
              ? `
                <a
                  href="${escaparHtml(
                    offer.link
                  )}"
                  class="public-offer-button"
                  target="_blank"
                  rel="noopener"
                >
                  🛒 VER OFERTA
                </a>
              `
              : ""
          }

        `;


        container.appendChild(
          article
        );

      }
    );

}


/* =========================================================
   HELPERS
========================================================= */

function normalizarEstadoCompra(
  estado
) {

  const value =
    String(
      estado ||
      "pendiente"
    )
      .toLowerCase()
      .trim();


  if (
    [
      "aprobada",
      "aprobado",
      "verificada",
      "verificado"
    ].includes(
      value
    )
  ) {

    return "aprobada";

  }


  if (
    [
      "rechazada",
      "rechazado"
    ].includes(
      value
    )
  ) {

    return "rechazada";

  }


  return "pendiente";

}


function normalizarTipo(
  tipo
) {

  const value =
    String(
      tipo ||
      ""
    )
      .toLowerCase()
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );


  if (
    value.includes(
      "banc"
    )
  ) {

    return "bancario";

  }


  if (
    value.includes(
      "exclus"
    ) ||
    value.includes(
      "meli"
    )
  ) {

    return "exclusivo";

  }


  return "relampago";

}


function obtenerNombreTipo(
  tipo
) {

  const value =
    normalizarTipo(
      tipo
    );


  if (
    value ===
    "bancario"
  ) {

    return "🏦 Bancario";

  }


  if (
    value ===
    "exclusivo"
  ) {

    return "👑 Meli+";

  }


  return "⚡ Relámpago";

}


function formatearPrecio(
  value
) {

  return new Intl.NumberFormat(
    "es-MX",
    {
      style:
        "currency",

      currency:
        "MXN",

      maximumFractionDigits:
        2
    }
  ).format(
    Number(
      value ||
      0
    )
  );

}


function fechaValor(
  value
) {

  if (!value) {
    return 0;
  }


  if (
    typeof value.toMillis ===
    "function"
  ) {

    return value.toMillis();

  }


  if (
    value.seconds
  ) {

    return (
      Number(
        value.seconds
      ) *
      1000
    );

  }


  const date =
    new Date(
      value
    );


  return Number.isNaN(
    date.getTime()
  )
    ? 0
    : date.getTime();

}


function obtenerFechaLocal() {

  const ahora =
    new Date();


  const year =
    ahora.getFullYear();


  const month =
    String(
      ahora.getMonth() +
      1
    )
      .padStart(
        2,
        "0"
      );


  const day =
    String(
      ahora.getDate()
    )
      .padStart(
        2,
        "0"
      );


  return `${year}-${month}-${day}`;

}


function escaparHtml(
  value
) {

  return String(
    value ??
    ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function setText(
  selector,
  value
) {

  const element =
    $(selector);


  if (element) {

    element.textContent =
      value;

  }

}


function mostrarToast(
  mensaje,
  tipo = ""
) {

  const toast =
    $("#toast");


  if (!toast) {
    return;
  }


  toast.textContent =
    mensaje;


  toast.className =
    "toast show";


  if (tipo) {

    toast.classList.add(
      tipo
    );

  }


  clearTimeout(
    window.__toastTimer
  );


  window.__toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      3000
    );

}