/* =========================================================
   ⚡ EL PATRÓN DE LAS OFERTAS
   ADMIN PRO v2.1
   =========================================================

   Compatible con:

   admin-pro.html
   admin-pro.css

   FIREBASE:
   Firestore

   IMPORTANTE:
   - No usa Firebase Storage
   - Imágenes como Base64
   - Cada colección carga independientemente
   - Un error en una colección NO bloquea las demás
   - No escribe estadísticas automáticamente
========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey:
    "AIzaSyDOoYZZhaTn6hbBQ0ml--mq8ByT0KdF9e0",

  authDomain:
    "el-patron-de-las-ofertas.firebaseapp.com",

  projectId:
    "el-patron-de-las-ofertas",

  storageBucket:
    "el-patron-de-las-ofertas.firebasestorage.app",

  messagingSenderId:
    "996329026447",

  appId:
    "1:996329026447:web:dde5b6748aff41e087d1fa",

  measurementId:
    "G-GTD9375PRW"
};


/* =========================================================
   INICIALIZAR FIREBASE
========================================================= */

let app = null;
let db = null;

let firebaseReady = false;

try {

  app = initializeApp(firebaseConfig);

  db = getFirestore(app);

  firebaseReady = true;

} catch (error) {

  console.error(
    "Error inicializando Firebase:",
    error
  );

}


/* =========================================================
   DATOS
========================================================= */

let ofertas = [];
let cupones = [];
let usuarios = [];
let copias = [];

let erroresColecciones = {};

let currentOfferId = null;
let currentCouponId = null;
let currentUserId = null;

let clicksChart = null;
let stateChart = null;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {

  return document.getElementById(id);

}


function setText(id, value) {

  const element = $(id);

  if (element) {

    element.textContent = value;

  }

}


function money(value) {

  let number = Number(
    String(value ?? 0)
      .replace(/[$,\s]/g, "")
  );

  if (Number.isNaN(number)) {

    number = 0;

  }

  return number.toLocaleString(
    "es-MX",
    {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }
  );

}


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function normalize(value) {

  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message,
  type = "success"
) {

  let toast = $("adminToast");

  if (!toast) {

    toast = document.createElement("div");

    toast.id = "adminToast";

    toast.className = "admin-toast";

    document.body.appendChild(toast);

  }

  toast.textContent = message;

  toast.className =
    `admin-toast show ${type}`;

  clearTimeout(
    window.adminToastTimer
  );

  window.adminToastTimer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 3500);

}


/* =========================================================
   FECHAS
========================================================= */

function toDate(value) {

  if (!value) {

    return null;

  }

  try {

    if (
      typeof value.toDate === "function"
    ) {

      return value.toDate();

    }

    if (
      value.seconds !== undefined
    ) {

      return new Date(
        Number(value.seconds) * 1000
      );

    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {

      return null;

    }

    return date;

  } catch {

    return null;

  }

}


function formatDate(value) {

  const date = toDate(value);

  if (!date) {

    return "Sin fecha";

  }

  return date.toLocaleDateString(
    "es-MX",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );

}


function formatTime(value) {

  const date = toDate(value);

  if (!date) {

    return "--:--";

  }

  return date.toLocaleTimeString(
    "es-MX",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


function dateKey(value) {

  const date = toDate(value);

  if (!date) {

    return null;

  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


/* =========================================================
   ESTADO FIREBASE
========================================================= */

function setFirebaseStatus(
  status,
  message
) {

  const box =
    $("firebaseStatus");

  const settings =
    $("settingsFirebaseStatus");

  if (box) {

    const dot =
      box.querySelector(
        ".status-dot"
      );

    const text =
      box.querySelector(
        "span:last-child"
      );

    if (dot) {

      dot.className =
        `status-dot ${status}`;

    }

    if (text) {

      text.textContent =
        message;

    } else {

      box.textContent =
        message;

    }

  }

  if (settings) {

    settings.textContent =
      message;

    settings.className =
      `settings-status ${
        status === "connected"
          ? "success"
          : ""
      }`;

  }

}


/* =========================================================
   CARGAR COLECCIÓN SEGURA
========================================================= */

/*
   ESTA ES LA CORRECCIÓN MÁS IMPORTANTE.

   Antes:

   Promise.all([
     ofertas,
     cupones,
     usuarios,
     copias
   ])

   Si una fallaba:
   TODO FALLABA.

   Ahora cada colección se carga
   por separado.
========================================================= */

async function safeLoadCollection(
  collectionName
) {

  if (!db) {

    return {
      data: [],
      error: new Error(
        "Firebase no está inicializado."
      )
    };

  }

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          collectionName
        )
      );

    const data = [];

    snapshot.forEach(
      item => {

        data.push({

          id: item.id,

          ...item.data()

        });

      }
    );

    erroresColecciones[
      collectionName
    ] = null;

    return {
      data,
      error: null
    };

  } catch (error) {

    console.error(
      `Firestore [${collectionName}]:`,
      error
    );

    erroresColecciones[
      collectionName
    ] = error;

    return {
      data: [],
      error
    };

  }

}


/* =========================================================
   CARGAR TODO
========================================================= */

async function loadAllData(
  silent = false
) {

  if (!firebaseReady || !db) {

    setFirebaseStatus(
      "error",
      "Firebase no disponible"
    );

    showToast(
      "❌ No se pudo inicializar Firebase",
      "error"
    );

    renderLoadingErrors();

    return;

  }


  if (!silent) {

    showToast(
      "🔄 Actualizando información..."
    );

  }


  setFirebaseStatus(
    "loading",
    "Conectando..."
  );


  /*
     CARGAMOS INDEPENDIENTEMENTE
  */

  const ofertasResult =
    await safeLoadCollection(
      "ofertas"
    );

  ofertas =
    ofertasResult.data;


  const cuponesResult =
    await safeLoadCollection(
      "cupones"
    );

  cupones =
    cuponesResult.data;


  const usuariosResult =
    await safeLoadCollection(
      "usuarios"
    );

  usuarios =
    usuariosResult.data;


  /*
     Aceptamos también
     copias_diarias si "copias"
     no existe / no tiene datos.
  */

  const copiasResult =
    await safeLoadCollection(
      "copias"
    );

  copias =
    copiasResult.data;


  /*
     Si no existe "copias", intentamos
     copias_diarias.
  */

  if (
    copias.length === 0 &&
    copiasResult.error
  ) {

    const copiasDiariasResult =
      await safeLoadCollection(
        "copias_diarias"
      );

    if (
      copiasDiariasResult.data.length
    ) {

      copias =
        copiasDiariasResult.data;

    }

  }


  const errors =
    Object.values(
      erroresColecciones
    )
      .filter(Boolean);


  if (errors.length === 0) {

    firebaseReady = true;

    setFirebaseStatus(
      "connected",
      "Firebase conectado"
    );

  } else {

    setFirebaseStatus(
      "warning",
      "Firebase conectado parcialmente"
    );

  }


  renderEverything();


  if (!silent) {

    if (errors.length) {

      showToast(
        "⚠️ Datos cargados parcialmente",
        "warning"
      );

    } else {

      showToast(
        "✅ Información actualizada"
      );

    }

  }

}


/* =========================================================
   ERRORES DE CARGA
========================================================= */

function renderLoadingErrors() {

  const errors =
    Object.entries(
      erroresColecciones
    )
      .filter(
        ([, error]) => error
      );


  if (!errors.length) {

    return;

  }


  console.warn(
    "Colecciones con error:",
    errors
  );

}


/* =========================================================
   DASHBOARD
========================================================= */

function calculateSavings() {

  return usuarios.reduce(
    (total, user) => {

      return (
        total +
        Number(
          user.ahorroTotal ||
          user.ahorro ||
          0
        )
      );

    },
    0
  );

}


function calculatePurchases() {

  return usuarios.reduce(
    (total, user) => {

      return (
        total +
        Number(
          user.compras ||
          0
        )
      );

    },
    0
  );

}


function calculateUsedCoupons() {

  return usuarios.reduce(
    (total, user) => {

      return (
        total +
        Number(
          user.cuponesUsados ||
          0
        )
      );

    },
    0
  );

}


function getCouponCode(coupon) {

  return (
    coupon.codigo ||
    coupon.code ||
    coupon.cupon ||
    coupon.codigoCupon ||
    ""
  );

}


function getCouponCopies(
  couponCode
) {

  if (!couponCode) {

    return 0;

  }

  const target =
    normalize(couponCode);

  return copias.filter(
    copy => {

      const code =
        copy.codigo ||
        copy.cupon ||
        copy.couponCode ||
        copy.code ||
        "";

      return (
        normalize(code) ===
        target
      );

    }
  ).length;

}


function renderDashboard() {

  const totalOffers =
    ofertas.length;

  const activeCoupons =
    cupones.filter(
      coupon => {

        const status =
          normalize(
            coupon.estado ||
            coupon.status ||
            "activo"
          );

        return !status.includes(
          "agot"
        );

      }
    ).length;

  const totalUsers =
    usuarios.length;

  const totalClicks =
    copias.length;

  const savings =
    calculateSavings();

  const purchases =
    calculatePurchases();


  setText(
    "statOffers",
    totalOffers
  );

  setText(
    "statCoupons",
    activeCoupons
  );

  setText(
    "statUsers",
    totalUsers
  );

  setText(
    "statClicks",
    totalClicks
  );

  setText(
    "statSavings",
    money(savings)
  );

  setText(
    "statPurchases",
    purchases
  );


  setText(
    "navCouponCount",
    cupones.length
  );

  setText(
    "navUserCount",
    usuarios.length
  );


  const now =
    new Date();

  setText(
    "lastUpdate",
    now.toLocaleTimeString(
      "es-MX",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    )
  );


  renderTopCoupon();

  renderActivity();

}


/* =========================================================
   CUPÓN MÁS COPIADO
========================================================= */

function getCouponStats() {

  const map = {};

  copias.forEach(
    copy => {

      const code =
        copy.codigo ||
        copy.cupon ||
        copy.couponCode ||
        copy.code ||
        "SIN CÓDIGO";

      if (!map[code]) {

        map[code] = 0;

      }

      map[code]++;

    }
  );


  return Object.entries(map)
    .map(
      ([code, count]) => ({
        code,
        count
      })
    )
    .sort(
      (a, b) =>
        b.count - a.count
    );

}


function getMostCopiedCoupon() {

  const stats =
    getCouponStats();

  return (
    stats[0] || {
      code: "",
      count: 0
    }
  );

}


function renderTopCoupon() {

  const container =
    $("topCoupon");

  if (!container) {

    return;

  }


  const top =
    getMostCopiedCoupon();


  if (!top.code) {

    container.innerHTML = `
      <div class="empty-state-small">
        <span>🎟️</span>
        <p>Aún no hay copias registradas.</p>
      </div>
    `;

    return;

  }


  container.innerHTML = `

    <div class="top-coupon-content">

      <div class="top-coupon-icon">
        🏆
      </div>

      <div>

        <strong>
          ${escapeHtml(top.code)}
        </strong>

        <span>
          ${top.count}
          ${top.count === 1 ? "copia" : "copias"}
        </span>

      </div>

    </div>

  `;

}


/* =========================================================
   ACTIVIDAD
========================================================= */

function renderActivity() {

  const container =
    $("activityList");

  if (!container) {

    return;

  }


  const recent =
    [...copias]
      .sort(
        (a, b) => {

          const da =
            toDate(
              a.fecha ||
              a.createdAt ||
              a.timestamp ||
              a.fechaHora
            );

          const dbb =
            toDate(
              b.fecha ||
              b.createdAt ||
              b.timestamp ||
              b.fechaHora
            );

          return (
            (dbb?.getTime() || 0) -
            (da?.getTime() || 0)
          );

        }
      )
      .slice(0, 8);


  if (!recent.length) {

    container.innerHTML = `
      <div class="empty-state-small">
        <span>⚡</span>
        <p>No hay actividad reciente.</p>
      </div>
    `;

    return;

  }


  container.innerHTML =
    recent.map(
      item => {

        const code =
          item.codigo ||
          item.cupon ||
          item.couponCode ||
          item.code ||
          "Cupón";

        const user =
          item.usuario ||
          item.nombre ||
          item.email ||
          "Usuario";


        return `

          <div class="activity-item">

            <div class="activity-icon">
              🎟️
            </div>

            <div class="activity-content">

              <strong>
                ${escapeHtml(code)}
              </strong>

              <span>
                ${escapeHtml(user)}
              </span>

            </div>

            <div class="activity-time">
              ${formatTime(
                item.fecha ||
                item.createdAt ||
                item.timestamp ||
                item.fechaHora
              )}
            </div>

          </div>

        `;

      }
    )
    .join("");

}


/* =========================================================
   OFERTAS
========================================================= */

function renderOffers() {

  const body =
    $("offersTableBody");

  if (!body) {

    return;

  }


  const search =
    normalize(
      $("offerSearch")?.value
    );


  let data =
    ofertas.filter(
      offer => {

        if (!search) {

          return true;

        }

        return normalize(
          `${offer.titulo || ""}
           ${offer.categoria || ""}
           ${offer.link || ""}`
        ).includes(search);

      }
    );


  setText(
    "offerTableCount",
    `${data.length} ${
      data.length === 1
        ? "oferta"
        : "ofertas"
    }`
  );


  if (!data.length) {

    body.innerHTML = `

      <tr>

        <td
          colspan="6"
          class="table-loading"
        >
          🔥 No hay ofertas para mostrar.
        </td>

      </tr>

    `;

    return;

  }


  body.innerHTML =
    data.map(
      offer => {

        const oldPrice =
          Number(
            offer.precioAntes ||
            offer.precioAnterior ||
            0
          );

        const currentPrice =
          Number(
            offer.precioActual ||
            offer.precio ||
            offer.currentPrice ||
            0
          );


        let discount = 0;

        if (
          oldPrice > 0 &&
          currentPrice > 0 &&
          currentPrice < oldPrice
        ) {

          discount =
            Math.round(
              (
                1 -
                currentPrice /
                  oldPrice
              ) * 100
            );

        }


        const clicks =
          Number(
            offer.clics ||
            offer.clicks ||
            0
          );


        return `

          <tr>

            <td>

              <div class="table-product">

                <div class="table-product-image">

                  ${
                    offer.imagenBase64 ||
                    offer.imagen
                      ? `
                        <img
                          src="${escapeHtml(
                            offer.imagenBase64 ||
                            offer.imagen
                          )}"
                          alt=""
                        >
                      `
                      : "🔥"
                  }

                </div>

                <div>

                  <strong>
                    ${escapeHtml(
                      offer.titulo ||
                      "Sin título"
                    )}
                  </strong>

                  <small>
                    ${escapeHtml(
                      offer.categoria ||
                      "General"
                    )}
                  </small>

                </div>

              </div>

            </td>

            <td>
              ${
                oldPrice
                  ? money(oldPrice)
                  : "—"
              }
            </td>

            <td>
              <strong>
                ${money(currentPrice)}
              </strong>
            </td>

            <td>
              ${
                discount
                  ? `-${discount}%`
                  : "—"
              }
            </td>

            <td>
              ${clicks}
            </td>

            <td>

              <div class="table-actions">

                <button
                  type="button"
                  data-edit-offer="${offer.id}"
                >
                  ✏️
                </button>

                <button
                  type="button"
                  class="danger"
                  data-delete-offer="${offer.id}"
                >
                  🗑️
                </button>

              </div>

            </td>

          </tr>

        `;

      }
    )
    .join("");

}


/* =========================================================
   CUPONES
========================================================= */

function couponTypeLabel(
  coupon
) {

  const type =
    normalize(
      coupon.tipo ||
      coupon.type ||
      ""
    );


  if (
    type.includes("flash") ||
    type.includes("relamp")
  ) {

    return "⚡ Relámpago";

  }

  if (
    type.includes("bank") ||
    type.includes("bancar")
  ) {

    return "🏦 Bancario";

  }

  return "🎁 Exclusivo";

}


function couponStatus(
  coupon
) {

  const status =
    normalize(
      coupon.estado ||
      coupon.status ||
      "activo"
    );


  if (
    status.includes("agot")
  ) {

    return {
      text: "🔴 Agotado",
      className: "expired"
    };

  }


  if (
    status.includes("por")
  ) {

    return {
      text: "🟠 Por agotarse",
      className: "warning"
    };

  }


  return {
    text: "🟢 Activo",
    className: "active"
  };

}


function renderCoupons() {

  const body =
    $("couponsTableBody");

  if (!body) {

    return;

  }


  const search =
    normalize(
      $("couponSearch")?.value
    );

  const filter =
    $("couponTypeFilter")?.value ||
    "all";


  let data =
    cupones.filter(
      coupon => {

        const text =
          normalize(
            `${getCouponCode(coupon)}
             ${coupon.titulo || ""}
             ${coupon.descuento || ""}
             ${coupon.banco || ""}`
          );


        if (
          search &&
          !text.includes(search)
        ) {

          return false;

        }


        if (
          filter === "all"
        ) {

          return true;

        }


        const type =
          normalize(
            coupon.tipo ||
            coupon.type ||
            ""
          );


        if (
          filter === "flash"
        ) {

          return (
            type.includes("flash") ||
            type.includes("relamp")
          );

        }


        if (
          filter === "exclusive"
        ) {

          return (
            type.includes("exclusive") ||
            type.includes("exclus")
          );

        }


        if (
          filter === "bank"
        ) {

          return (
            type.includes("bank") ||
            type.includes("bancar")
          );

        }


        return true;

      }
    );


  setText(
    "couponTableCount",
    `${data.length} ${
      data.length === 1
        ? "cupón"
        : "cupones"
    }`
  );


  updateCouponMiniStats();


  if (!data.length) {

    body.innerHTML = `

      <tr>

        <td
          colspan="8"
          class="table-loading"
        >
          🎟️ No hay cupones para mostrar.
        </td>

      </tr>

    `;

    return;

  }


  body.innerHTML =
    data.map(
      coupon => {

        const code =
          getCouponCode(coupon);

        const status =
          couponStatus(coupon);

        const copies =
          getCouponCopies(code);


        return `

          <tr>

            <td>

              <strong>
                ${escapeHtml(
                  code ||
                  "SIN CÓDIGO"
                )}
              </strong>

              <small>
                ${escapeHtml(
                  coupon.titulo ||
                  ""
                )}
              </small>

            </td>

            <td>
              ${couponTypeLabel(coupon)}
            </td>

            <td>
              ${escapeHtml(
                coupon.descuento ||
                "—"
              )}
            </td>

            <td>
              ${
                coupon.compraMinima ??
                coupon.minimo ??
                coupon.minimum
                  ? money(
                      coupon.compraMinima ??
                      coupon.minimo ??
                      coupon.minimum
                    )
                  : "—"
              }
            </td>

            <td>
              ${
                coupon.tope ??
                coupon.maximo ??
                coupon.maximum
                  ? money(
                      coupon.tope ??
                      coupon.maximo ??
                      coupon.maximum
                    )
                  : "—"
              }
            </td>

            <td>

              <span
                class="status-badge ${status.className}"
              >
                ${status.text}
              </span>

            </td>

            <td>
              ${copies}
            </td>

            <td>

              <div class="table-actions">

                <button
                  type="button"
                  data-edit-coupon="${coupon.id}"
                >
                  ✏️
                </button>

                <button
                  type="button"
                  class="danger"
                  data-delete-coupon="${coupon.id}"
                >
                  🗑️
                </button>

              </div>

            </td>

          </tr>

        `;

      }
    )
    .join("");

}


/* =========================================================
   ESTADÍSTICAS DE CUPONES
========================================================= */

function updateCouponMiniStats() {

  let active = 0;
  let warning = 0;
  let expired = 0;
  let copies = 0;


  cupones.forEach(
    coupon => {

      const status =
        couponStatus(coupon);

      if (
        status.className ===
        "active"
      ) {

        active++;

      } else if (
        status.className ===
        "warning"
      ) {

        warning++;

      } else {

        expired++;

      }


      copies +=
        getCouponCopies(
          getCouponCode(coupon)
        );

    }
  );


  setText(
    "couponActiveCount",
    active
  );

  setText(
    "couponWarningCount",
    warning
  );

  setText(
    "couponExpiredCount",
    expired
  );

  setText(
    "couponCopiesCount",
    copies
  );

}


/* =========================================================
   USUARIOS
========================================================= */

function userStatus(
  user
) {

  const status =
    normalize(
      user.estadoVerificacion ||
      user.estadoUsuario ||
      user.status ||
      user.estado ||
      "pendiente"
    );


  if (
    status.includes("rechaz")
  ) {

    return "rechazado";

  }


  if (
    status.includes("verific") ||
    status.includes("activo")
  ) {

    return "verificado";

  }


  return "pendiente";

}


function renderUsers() {

  const body =
    $("usersTableBody");

  if (!body) {

    return;

  }


  const search =
    normalize(
      $("userSearch")?.value
    );

  const filter =
    $("userStatusFilter")?.value ||
    "all";


  const data =
    usuarios.filter(
      user => {

        const text =
          normalize(
            `${user.nombre || ""}
             ${user.email || ""}
             ${user.estado || ""}
             ${user.estadoVerificacion || ""}`
          );


        if (
          search &&
          !text.includes(search)
        ) {

          return false;

        }


        if (
          filter !== "all" &&
          userStatus(user) !==
            filter
        ) {

          return false;

        }


        return true;

      }
    );


  updateUserStats();


  setText(
    "userTableCount",
    `${data.length} ${
      data.length === 1
        ? "usuario"
        : "usuarios"
    }`
  );


  if (!data.length) {

    body.innerHTML = `

      <tr>

        <td
          colspan="8"
          class="table-loading"
        >
          👥 No hay usuarios para mostrar.
        </td>

      </tr>

    `;

    return;

  }


  body.innerHTML =
    data.map(
      user => {

        const status =
          userStatus(user);


        return `

          <tr>

            <td>

              <div class="table-product">

                <div class="table-product-image">

                  ${
                    user.fotoBase64
                      ? `
                        <img
                          src="${escapeHtml(
                            user.fotoBase64
                          )}"
                          alt=""
                        >
                      `
                      : "👤"
                  }

                </div>

                <div>

                  <strong>
                    ${escapeHtml(
                      user.nombre ||
                      "Sin nombre"
                    )}
                  </strong>

                  <small>
                    ${escapeHtml(
                      user.email ||
                      "Sin correo"
                    )}
                  </small>

                </div>

              </div>

            </td>

            <td>

              <span
                class="status-badge ${
                  status === "verificado"
                    ? "active"
                    : status === "rechazado"
                      ? "expired"
                      : "warning"
                }"
              >
                ${
                  status === "verificado"
                    ? "✅ Verificado"
                    : status === "rechazado"
                      ? "🔴 Rechazado"
                      : "⏳ Pendiente"
                }
              </span>

            </td>

            <td>
              ${escapeHtml(
                user.estado ||
                user.estadoMexico ||
                "—"
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
              ${money(
                user.ahorroTotal ||
                user.ahorro ||
                0
              )}
            </td>

            <td>
              ${formatDate(
                user.createdAt ||
                user.fechaRegistro ||
                user.registro
              )}
            </td>

            <td>

              <div class="table-actions">

                <button
                  type="button"
                  data-edit-user="${user.id}"
                >
                  👁️
                </button>

                <button
                  type="button"
                  class="danger"
                  data-delete-user="${user.id}"
                >
                  🗑️
                </button>

              </div>

            </td>

          </tr>

        `;

      }
    )
    .join("");

}


/* =========================================================
   ESTADÍSTICAS DE USUARIOS
========================================================= */

function updateUserStats() {

  let verified = 0;
  let pending = 0;
  let savings = 0;


  usuarios.forEach(
    user => {

      const status =
        userStatus(user);

      if (
        status === "verificado"
      ) {

        verified++;

      } else if (
        status === "pendiente"
      ) {

        pending++;

      }


      savings +=
        Number(
          user.ahorroTotal ||
          user.ahorro ||
          0
        );

    }
  );


  setText(
    "usersRegisteredCount",
    usuarios.length
  );

  setText(
    "usersVerifiedCount",
    verified
  );

  setText(
    "usersPendingCount",
    pending
  );

  setText(
    "usersSavingsCount",
    money(savings)
  );

}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

function getClicksByDay() {

  const map = {};


  copias.forEach(
    copy => {

      const key =
        dateKey(
          copy.fecha ||
          copy.createdAt ||
          copy.timestamp ||
          copy.fechaHora
        );


      if (!key) {

        return;

      }


      if (!map[key]) {

        map[key] = 0;

      }

      map[key]++;

    }
  );


  return map;

}


function getUsersByState() {

  const map = {};


  usuarios.forEach(
    user => {

      const state =
        user.estado ||
        user.estadoMexico ||
        user.estadoRepublica ||
        "Sin especificar";


      if (!map[state]) {

        map[state] = 0;

      }

      map[state]++;

    }
  );


  return map;

}


function renderStatistics() {

  const totalClicks =
    copias.length;

  const totalUsers =
    usuarios.length;

  const totalSavings =
    calculateSavings();

  const totalPurchases =
    calculatePurchases();

  const totalCouponUses =
    calculateUsedCoupons();


  setText(
    "performanceClicks",
    totalClicks
  );

  setText(
    "performanceCoupons",
    totalCouponUses
  );

  setText(
    "performanceUsers",
    totalUsers
  );

  setText(
    "performanceSavings",
    money(totalSavings)
  );

  setText(
    "performancePurchases",
    totalPurchases
  );


  renderCouponRanking();

  renderStateList();

  renderCharts();

}


/* =========================================================
   RANKING DE CUPONES
========================================================= */

function renderCouponRanking() {

  const container =
    $("couponRankingList");

  if (!container) {

    return;

  }


  const stats =
    getCouponStats()
      .slice(0, 10);


  if (!stats.length) {

    container.innerHTML = `

      <div class="empty-state-small">

        <span>🎟️</span>

        <p>
          No hay copias registradas.
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML =
    stats.map(
      (item, index) => {

        return `

          <div class="coupon-ranking-item">

            <div class="ranking-number">
              ${index + 1}
            </div>

            <div class="ranking-name">

              <strong>
                ${escapeHtml(
                  item.code
                )}
              </strong>

            </div>

            <strong>
              ${item.count}
            </strong>

          </div>

        `;

      }
    )
    .join("");

}


/* =========================================================
   ESTADOS
========================================================= */

function renderStateList() {

  const container =
    $("stateList");

  if (!container) {

    return;

  }


  const states =
    Object.entries(
      getUsersByState()
    )
      .sort(
        ([, a], [, b]) =>
          b - a
      )
      .slice(0, 10);


  if (!states.length) {

    container.innerHTML = "";

    return;

  }


  container.innerHTML =
    states.map(
      ([state, count]) => {

        return `

          <div class="state-row">

            <span>
              ${escapeHtml(state)}
            </span>

            <strong>
              ${count}
            </strong>

          </div>

        `;

      }
    )
    .join("");

}


/* =========================================================
   CHARTS
========================================================= */

function renderCharts() {

  if (
    typeof Chart ===
    "undefined"
  ) {

    console.warn(
      "Chart.js todavía no está disponible."
    );

    return;

  }


  renderClicksChart();

  renderStateChart();

}


/* =========================================================
   GRÁFICA CLICS
========================================================= */

function renderClicksChart() {

  const canvas =
    $("clicksByDayChart");

  if (!canvas) {

    return;

  }


  const map =
    getClicksByDay();


  const entries =
    Object.entries(map)
      .sort(
        ([a], [b]) =>
          a.localeCompare(b)
      )
      .slice(-30);


  const labels =
    entries.map(
      ([date]) => {

        const parts =
          date.split("-");

        return `${parts[2]}/${parts[1]}`;

      }
    );


  const values =
    entries.map(
      ([, value]) =>
        value
    );


  const empty =
    $("clicksChartEmpty");


  if (!entries.length) {

    if (empty) {

      empty.style.display =
        "flex";

    }

    return;

  }


  if (empty) {

    empty.style.display =
      "none";

  }


  if (clicksChart) {

    clicksChart.destroy();

  }


  clicksChart =
    new Chart(
      canvas,
      {

        type: "line",

        data: {

          labels,

          datasets: [

            {

              label: "Clics",

              data: values,

              tension: 0.35,

              fill: true

            }

          ]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {

              display: false

            }

          },

          scales: {

            y: {

              beginAtZero: true,

              ticks: {

                precision: 0

              }

            }

          }

        }

      }
    );


  setText(
    "chartClicksTotal",
    `${copias.length} clics`
  );

}


/* =========================================================
   GRÁFICA ESTADOS
========================================================= */

function renderStateChart() {

  const canvas =
    $("usersByStateChart");

  if (!canvas) {

    return;

  }


  const states =
    Object.entries(
      getUsersByState()
    )
      .sort(
        ([, a], [, b]) =>
          b - a
      )
      .slice(0, 10);


  const empty =
    $("stateChartEmpty");


  if (!states.length) {

    if (empty) {

      empty.style.display =
        "flex";

    }

    return;

  }


  if (empty) {

    empty.style.display =
      "none";

  }


  if (stateChart) {

    stateChart.destroy();

  }


  stateChart =
    new Chart(
      canvas,
      {

        type: "doughnut",

        data: {

          labels:
            states.map(
              ([state]) =>
                state
            ),

          datasets: [

            {

              data:
                states.map(
                  ([, count]) =>
                    count
                )

            }

          ]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {

              position:
                "bottom"

            }

          }

        }

      }
    );

}


/* =========================================================
   CLICS
========================================================= */

function renderClicks() {

  const body =
    $("clicksTableBody");

  if (!body) {

    return;

  }


  const search =
    normalize(
      $("clickSearch")?.value
    );


  let data =
    copias.filter(
      copy => {

        if (!search) {

          return true;

        }


        const text =
          normalize(
            `${copy.codigo || ""}
             ${copy.cupon || ""}
             ${copy.couponCode || ""}
             ${copy.usuario || ""}
             ${copy.nombre || ""}
             ${copy.email || ""}`
          );


        return text.includes(
          search
        );

      }
    );


  data =
    [...data].sort(
      (a, b) => {

        const da =
          toDate(
            a.fecha ||
            a.createdAt ||
            a.timestamp
          );

        const dbb =
          toDate(
            b.fecha ||
            b.createdAt ||
            b.timestamp
          );

        return (
          (dbb?.getTime() || 0) -
          (da?.getTime() || 0)
        );

      }
    );


  setText(
    "clickTableCount",
    `${data.length} ${
      data.length === 1
        ? "registro"
        : "registros"
    }`
  );


  setText(
    "clicksTotal",
    copias.length
  );


  const today =
    dateKey(
      new Date()
    );


  const todayClicks =
    copias.filter(
      copy =>
        dateKey(
          copy.fecha ||
          copy.createdAt ||
          copy.timestamp
        ) === today
    ).length;


  setText(
    "clicksToday",
    todayClicks
  );


  const days =
    new Set(
      copias
        .map(
          copy =>
            dateKey(
              copy.fecha ||
              copy.createdAt ||
              copy.timestamp
            )
        )
        .filter(Boolean)
    );


  const average =
    days.size
      ? (
          copias.length /
          days.size
        ).toFixed(1)
      : "0";


  setText(
    "clicksAverage",
    average
  );


  const mostCopied =
    getMostCopiedCoupon();


  setText(
    "mostCopiedShort",
    mostCopied.code ||
      "—"
  );


  if (!data.length) {

    body.innerHTML = `

      <tr>

        <td
          colspan="5"
          class="table-loading"
        >
          👆 No hay actividad registrada.
        </td>

      </tr>

    `;

    return;

  }


  body.innerHTML =
    data.map(
      copy => {

        const code =
          copy.codigo ||
          copy.cupon ||
          copy.couponCode ||
          copy.code ||
          "—";

        const user =
          copy.usuario ||
          copy.nombre ||
          copy.email ||
          "Usuario";


        return `

          <tr>

            <td>
              <strong>
                ${escapeHtml(code)}
              </strong>
            </td>

            <td>
              ${escapeHtml(user)}
            </td>

            <td>
              ${formatDate(
                copy.fecha ||
                copy.createdAt ||
                copy.timestamp
              )}
            </td>

            <td>
              ${formatTime(
                copy.fecha ||
                copy.createdAt ||
                copy.timestamp
              )}
            </td>

            <td>

              <span class="status-badge active">
                ✅ Registrado
              </span>

            </td>

          </tr>

        `;

      }
    )
    .join("");

}


/* =========================================================
   RANKING USUARIOS
========================================================= */

function renderRanking() {

  const body =
    $("rankingTableBody");

  const grid =
    $("rankingGrid");


  const ranked =
    [...usuarios]
      .sort(
        (a, b) =>
          Number(
            b.ahorroTotal ||
            b.ahorro ||
            0
          ) -
          Number(
            a.ahorroTotal ||
            a.ahorro ||
            0
          )
      );


  if (grid) {

    if (!ranked.length) {

      grid.innerHTML = `

        <div class="ranking-loading">

          🏆

          <p>
            No hay usuarios todavía.
          </p>

        </div>

      `;

    } else {

      grid.innerHTML =
        ranked
          .slice(0, 3)
          .map(
            (user, index) => {

              return `

                <div class="ranking-card">

                  <div class="ranking-position">
                    ${
                      index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : "🥉"
                    }
                  </div>

                  <strong>
                    ${escapeHtml(
                      user.nombre ||
                      "Usuario"
                    )}
                  </strong>

                  <span>
                    ${money(
                      user.ahorroTotal ||
                      user.ahorro ||
                      0
                    )}
                  </span>

                </div>

              `;

            }
          )
          .join("");

    }

  }


  if (!body) {

    return;

  }


  if (!ranked.length) {

    body.innerHTML = `

      <tr>

        <td
          colspan="6"
          class="table-loading"
        >
          🏆 No hay usuarios registrados.
        </td>

      </tr>

    `;

    return;

  }


  body.innerHTML =
    ranked.map(
      (user, index) => {

        return `

          <tr>

            <td>
              <strong>
                #${index + 1}
              </strong>
            </td>

            <td>
              ${escapeHtml(
                user.nombre ||
                "Sin nombre"
              )}
            </td>

            <td>
              <strong>
                ${money(
                  user.ahorroTotal ||
                  user.ahorro ||
                  0
                )}
              </strong>
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

              <span class="status-badge active">
                ${escapeHtml(
                  user.estadoVerificacion ||
                  "Activo"
                )}
              </span>

            </td>

          </tr>

        `;

      }
    )
    .join("");

}


/* =========================================================
   RENDER TODO
========================================================= */

function renderEverything() {

  renderDashboard();

  renderOffers();

  renderCoupons();

  renderUsers();

  renderStatistics();

  renderClicks();

  renderRanking();

}


/* =========================================================
   NAVEGACIÓN
========================================================= */

const sectionNames = {

  dashboard: {
    breadcrumb: "Dashboard",
    title: "Panel de control"
  },

  ofertas: {
    breadcrumb: "Contenido",
    title: "🔥 Ofertas"
  },

  cupones: {
    breadcrumb: "Cupones",
    title: "🎟️ Administración de cupones"
  },

  usuarios: {
    breadcrumb: "Comunidad",
    title: "👥 Usuarios"
  },

  estadisticas: {
    breadcrumb: "Analítica",
    title: "📈 Estadísticas"
  },

  clics: {
    breadcrumb: "Actividad",
    title: "👆 Clics y copias"
  },

  ranking: {
    breadcrumb: "Comunidad",
    title: "🏆 Comprador del mes"
  },

  configuracion: {
    breadcrumb: "Sistema",
    title: "⚙️ Configuración"
  }

};


function showSection(
  section
) {

  document
    .querySelectorAll(
      ".admin-section"
    )
    .forEach(
      item => {

        item.classList.toggle(
          "active",
          item.id ===
            `section-${section}`
        );

      }
    );


  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.section ===
            section
        );

      }
    );


  const info =
    sectionNames[section] ||
    sectionNames.dashboard;


  setText(
    "breadcrumb",
    info.breadcrumb
  );

  setText(
    "pageTitle",
    info.title
  );


  if (section === "clics") {

    renderClicks();

  }


  if (section === "ranking") {

    renderRanking();

  }


  if (section === "estadisticas") {

    setTimeout(
      renderCharts,
      50
    );

  }


  /*
     Cerrar menú móvil
  */

  const sidebar =
    $("sidebar");

  const overlay =
    $("sidebarOverlay");

  if (sidebar) {

    sidebar.classList.remove(
      "open"
    );

  }

  if (overlay) {

    overlay.classList.remove(
      "show"
    );

  }

}


/* =========================================================
   EVENTOS NAVEGACIÓN
========================================================= */

document.addEventListener(
  "click",
  event => {

    const nav =
      event.target.closest(
        ".nav-item"
      );


    if (nav) {

      event.preventDefault();

      showSection(
        nav.dataset.section
      );

      return;

    }


    const quick =
      event.target.closest(
        ".quick-action"
      );


    if (quick) {

      event.preventDefault();

      showSection(
        quick.dataset.sectionTarget
      );

      return;

    }

  }
);


/* =========================================================
   MENÚ MÓVIL
========================================================= */

function openMobileMenu() {

  const sidebar =
    $("sidebar");

  const overlay =
    $("sidebarOverlay");


  if (sidebar) {

    sidebar.classList.add(
      "open"
    );

  }

  if (overlay) {

    overlay.classList.add(
      "show"
    );

  }

}


function closeMobileMenu() {

  const sidebar =
    $("sidebar");

  const overlay =
    $("sidebarOverlay");


  if (sidebar) {

    sidebar.classList.remove(
      "open"
    );

  }

  if (overlay) {

    overlay.classList.remove(
      "show"
    );

  }

}


$("mobileMenuButton")
  ?.addEventListener(
    "click",
    openMobileMenu
  );


$("sidebarClose")
  ?.addEventListener(
    "click",
    closeMobileMenu
  );


$("sidebarOverlay")
  ?.addEventListener(
    "click",
    closeMobileMenu
  );


/* =========================================================
   MODALES
========================================================= */

function openModal(
  id
) {

  const modal =
    $(id);

  if (!modal) {

    return;

  }

  modal.classList.add(
    "show"
  );

}


function closeModal(
  id
) {

  const modal =
    $(id);

  if (!modal) {

    return;

  }

  modal.classList.remove(
    "show"
  );

}


document.addEventListener(
  "click",
  event => {

    const close =
      event.target.closest(
        "[data-close-modal]"
      );


    if (close) {

      closeModal(
        close.dataset.closeModal
      );

    }


    if (
      event.target.classList.contains(
        "admin-modal"
      )
    ) {

      event.target.classList.remove(
        "show"
      );

    }

  }
);


/* =========================================================
   LIMPIAR FORMULARIO CUPÓN
========================================================= */

function clearCouponForm() {

  currentCouponId = null;


  const form =
    $("couponForm");

  if (form) {

    form.reset();

  }


  setValue(
    "couponStatus",
    "activo"
  );

  setValue(
    "couponType",
    "flash"
  );


  setText(
    "couponModalTitle",
    "🎟️ Nuevo cupón"
  );


  setText(
    "couponFormMessage",
    ""
  );

}


function setValue(
  id,
  value
) {

  const element =
    $(id);

  if (element) {

    element.value =
      value ?? "";

  }

}


/* =========================================================
   LIMPIAR OFERTA
========================================================= */

function clearOfferForm() {

  currentOfferId = null;


  const form =
    $("offerForm");

  if (form) {

    form.reset();

  }


  setText(
    "offerFormMessage",
    ""
  );

}


/* =========================================================
   NUEVO CUPÓN
========================================================= */

$("newCouponButton")
  ?.addEventListener(
    "click",
    () => {

      clearCouponForm();

      openModal(
        "couponModal"
      );

    }
  );


/* =========================================================
   NUEVA OFERTA
========================================================= */

$("newOfferButton")
  ?.addEventListener(
    "click",
    () => {

      clearOfferForm();

      openModal(
        "offerModal"
      );

    }
  );


/* =========================================================
   EDITAR CUPÓN
========================================================= */

async function editCoupon(
  id
) {

  const coupon =
    cupones.find(
      item =>
        item.id === id
    );


  if (!coupon) {

    showToast(
      "❌ Cupón no encontrado",
      "error"
    );

    return;

  }


  currentCouponId =
    id;


  setValue(
    "couponId",
    id
  );

  setValue(
    "couponCode",
    getCouponCode(coupon)
  );

  setValue(
    "couponTitle",
    coupon.titulo ||
    coupon.nombre ||
    ""
  );

  setValue(
    "couponDiscount",
    coupon.descuento ||
    ""
  );


  let type =
    normalize(
      coupon.tipo ||
      coupon.type ||
      "flash"
    );


  if (
    type.includes("bancar")
  ) {

    type = "bank";

  } else if (
    type.includes("exclus")
  ) {

    type = "exclusive";

  } else {

    type = "flash";

  }


  setValue(
    "couponType",
    type
  );


  setValue(
    "couponMinimum",
    coupon.compraMinima ??
    coupon.minimo ??
    coupon.minimum ??
    ""
  );

  setValue(
    "couponMaximum",
    coupon.tope ??
    coupon.maximo ??
    coupon.maximum ??
    ""
  );


  setValue(
    "couponStatus",
    coupon.estado ||
    "activo"
  );


  setValue(
    "couponCategory",
    coupon.categoria ||
    ""
  );


  setValue(
    "couponLink",
    coupon.link ||
    coupon.enlace ||
    ""
  );


  setValue(
    "couponBank",
    coupon.banco ||
    ""
  );


  setText(
    "couponModalTitle",
    "🎟️ Editar cupón"
  );


  openModal(
    "couponModal"
  );

}


/* =========================================================
   GUARDAR CUPÓN
========================================================= */

async function saveCoupon(
  event
) {

  if (
    event &&
    event.preventDefault
  ) {

    event.preventDefault();

  }


  if (!db) {

    showToast(
      "❌ Firebase no está disponible",
      "error"
    );

    return;

  }


  const code =
    $("couponCode")?.value
      .trim()
      .toUpperCase();


  const title =
    $("couponTitle")?.value
      .trim();


  if (!code || !title) {

    showToast(
      "❌ Completa código y título",
      "error"
    );

    return;

  }


  const type =
    $("couponType")?.value ||
    "flash";


  const data = {

    codigo: code,

    titulo: title,

    descuento:
      $("couponDiscount")?.value
        .trim() || "",

    tipo: type,

    compraMinima:
      Number(
        $("couponMinimum")?.value ||
        0
      ),

    tope:
      Number(
        $("couponMaximum")?.value ||
        0
      ),

    estado:
      $("couponStatus")?.value ||
      "activo",

    categoria:
      $("couponCategory")?.value
        .trim() || "General",

    link:
      $("couponLink")?.value
        .trim() || "",

    banco:
      $("couponBank")?.value
        .trim() || "",

    actualizado:
      serverTimestamp()

  };


  try {

    if (currentCouponId) {

      await updateDoc(
        doc(
          db,
          "cupones",
          currentCouponId
        ),
        data
      );


      showToast(
        "✅ Cupón actualizado"
      );

    } else {

      data.creado =
        serverTimestamp();


      await addDoc(
        collection(
          db,
          "cupones"
        ),
        data
      );


      showToast(
        "✅ Cupón creado"
      );

    }


    closeModal(
      "couponModal"
    );

    currentCouponId = null;

    await loadAllData(
      true
    );

  } catch (error) {

    console.error(
      "Guardar cupón:",
      error
    );

    showToast(
      `❌ No se pudo guardar: ${
        firebaseErrorMessage(error)
      }`,
      "error"
    );

  }

}


/* =========================================================
   EDITAR OFERTA
========================================================= */

function editOffer(
  id
) {

  const offer =
    ofertas.find(
      item =>
        item.id === id
    );


  if (!offer) {

    showToast(
      "❌ Oferta no encontrada",
      "error"
    );

    return;

  }


  currentOfferId =
    id;


  setValue(
    "offerId",
    id
  );

  setValue(
    "offerTitle",
    offer.titulo ||
    ""
  );

  setValue(
    "offerOldPrice",
    offer.precioAntes ||
    offer.precioAnterior ||
    ""
  );

  setValue(
    "offerCurrentPrice",
    offer.precioActual ||
    offer.precio ||
    ""
  );

  setValue(
    "offerCategory",
    offer.categoria ||
    ""
  );

  setValue(
    "offerLink",
    offer.link ||
    offer.enlace ||
    ""
  );

  setValue(
    "offerImage",
    offer.imagenBase64 ||
    offer.imagen ||
    ""
  );


  openModal(
    "offerModal"
  );

}


/* =========================================================
   GUARDAR OFERTA
========================================================= */

async function saveOffer(
  event
) {

  if (
    event &&
    event.preventDefault
  ) {

    event.preventDefault();

  }


  if (!db) {

    showToast(
      "❌ Firebase no está disponible",
      "error"
    );

    return;

  }


  const title =
    $("offerTitle")?.value
      .trim();


  const currentPrice =
    Number(
      $("offerCurrentPrice")
        ?.value || 0
    );


  const oldPrice =
    Number(
      $("offerOldPrice")
        ?.value || 0
    );


  const category =
    $("offerCategory")?.value
      .trim() || "General";


  const link =
    $("offerLink")?.value
      .trim();


  const image =
    $("offerImage")?.value
      .trim();


  if (!title) {

    showToast(
      "❌ Escribe el título",
      "error"
    );

    return;

  }


  if (!currentPrice) {

    showToast(
      "❌ Escribe el precio actual",
      "error"
    );

    return;

  }


  if (!link) {

    showToast(
      "❌ Escribe el enlace",
      "error"
    );

    return;

  }


  const data = {

    titulo: title,

    precioAntes:
      oldPrice,

    precioActual:
      currentPrice,

    categoria:
      category,

    link:
      link,

    imagen:
      image,

    imagenBase64:
      image,

    actualizado:
      serverTimestamp()

  };


  try {

    if (currentOfferId) {

      await updateDoc(
        doc(
          db,
          "ofertas",
          currentOfferId
        ),
        data
      );


      showToast(
        "✅ Oferta actualizada"
      );

    } else {

      data.creado =
        serverTimestamp();


      data.clics = 0;


      await addDoc(
        collection(
          db,
          "ofertas"
        ),
        data
      );


      showToast(
        "✅ Oferta publicada"
      );

    }


    closeModal(
      "offerModal"
    );

    currentOfferId = null;

    await loadAllData(
      true
    );

  } catch (error) {

    console.error(
      "Guardar oferta:",
      error
    );

    showToast(
      `❌ No se pudo guardar: ${
        firebaseErrorMessage(error)
      }`,
      "error"
    );

  }

}


/* =========================================================
   EDITAR USUARIO
========================================================= */

function editUser(
  id
) {

  const user =
    usuarios.find(
      item =>
        item.id === id
    );


  if (!user) {

    showToast(
      "❌ Usuario no encontrado",
      "error"
    );

    return;

  }


  currentUserId =
    id;


  const container =
    $("userModalContent");

  if (!container) {

    return;

  }


  container.innerHTML = `

    <div class="user-modal-info">

      <div class="user-modal-avatar">

        ${
          user.fotoBase64
            ? `
              <img
                src="${escapeHtml(
                  user.fotoBase64
                )}"
                alt=""
              >
            `
            : "👤"
        }

      </div>

      <h3>
        ${escapeHtml(
          user.nombre ||
          "Sin nombre"
        )}
      </h3>

      <p>
        ${escapeHtml(
          user.email ||
          "Sin correo"
        )}
      </p>

      <p>
        📍 ${escapeHtml(
          user.estado ||
          "Sin estado"
        )}
      </p>

      <hr>

      <p>
        💰 Ahorro:
        <strong>
          ${money(
            user.ahorroTotal ||
            user.ahorro ||
            0
          )}
        </strong>
      </p>

      <p>
        🛒 Compras:
        <strong>
          ${Number(
            user.compras ||
            0
          )}
        </strong>
      </p>

      <p>
        🎟️ Cupones usados:
        <strong>
          ${Number(
            user.cuponesUsados ||
            0
          )}
        </strong>
      </p>

      <p>
        📅 Registro:
        <strong>
          ${formatDate(
            user.createdAt ||
            user.fechaRegistro ||
            user.registro
          )}
        </strong>
      </p>

      <p>
        🔐 Estado:
        <strong>
          ${escapeHtml(
            user.estadoVerificacion ||
            user.estado ||
            "Pendiente"
          )}
        </strong>
      </p>

    </div>

  `;


  openModal(
    "userModal"
  );

}


/* =========================================================
   SAVE USER
========================================================= */

async function saveUser(
  event
) {

  if (
    event &&
    event.preventDefault
  ) {

    event.preventDefault();

  }


  /*
     El HTML actual no tiene formulario
     de edición de usuarios.

     Se deja preparado para futuras
     ampliaciones.
  */

}


/* =========================================================
   ELIMINAR OFERTA
========================================================= */

async function deleteOffer(
  id
) {

  const offer =
    ofertas.find(
      item =>
        item.id === id
    );


  if (!offer) {

    return;

  }


  const confirmed =
    confirm(
      `¿Eliminar la oferta "${
        offer.titulo ||
        "Sin título"
      }"?`
    );


  if (!confirmed) {

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


    showToast(
      "🗑️ Oferta eliminada"
    );


    await loadAllData(
      true
    );

  } catch (error) {

    console.error(
      error
    );

    showToast(
      `❌ No se pudo eliminar: ${
        firebaseErrorMessage(error)
      }`,
      "error"
    );

  }

}


/* =========================================================
   ELIMINAR CUPÓN
========================================================= */

async function deleteCoupon(
  id
) {

  const coupon =
    cupones.find(
      item =>
        item.id === id
    );


  if (!coupon) {

    return;

  }


  const code =
    getCouponCode(coupon);


  const confirmed =
    confirm(
      `¿Eliminar el cupón "${code}"?`
    );


  if (!confirmed) {

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


    showToast(
      "🗑️ Cupón eliminado"
    );


    await loadAllData(
      true
    );

  } catch (error) {

    console.error(
      error
    );

    showToast(
      `❌ No se pudo eliminar: ${
        firebaseErrorMessage(error)
      }`,
      "error"
    );

  }

}


/* =========================================================
   ELIMINAR USUARIO
========================================================= */

async function deleteUser(
  id
) {

  const user =
    usuarios.find(
      item =>
        item.id === id
    );


  if (!user) {

    return;

  }


  const confirmed =
    confirm(
      `¿Eliminar al usuario "${
        user.nombre ||
        user.email ||
        "Usuario"
      }"?`
    );


  if (!confirmed) {

    return;

  }


  try {

    await deleteDoc(
      doc(
        db,
        "usuarios",
        id
      )
    );


    showToast(
      "🗑️ Usuario eliminado"
    );


    await loadAllData(
      true
    );

  } catch (error) {

    console.error(
      error
    );

    showToast(
      `❌ No se pudo eliminar: ${
        firebaseErrorMessage(error)
      }`,
      "error"
    );

  }

}


/* =========================================================
   MENSAJES FIREBASE
========================================================= */

function firebaseErrorMessage(
  error
) {

  if (!error) {

    return "Error desconocido";

  }


  const code =
    error.code || "";


  if (
    code.includes(
      "permission-denied"
    )
  ) {

    return "Permisos de Firestore";

  }


  if (
    code.includes(
      "failed-precondition"
    )
  ) {

    return "Configuración de Firestore";

  }


  if (
    code.includes(
      "unavailable"
    )
  ) {

    return "Firebase no disponible";

  }


  if (
    code.includes(
      "not-found"
    )
  ) {

    return "Documento no encontrado";

  }


  return (
    error.message ||
    "Error desconocido"
  );

}


/* =========================================================
   EVENTOS TABLAS
========================================================= */

document.addEventListener(
  "click",
  event => {

    const editOfferButton =
      event.target.closest(
        "[data-edit-offer]"
      );


    if (editOfferButton) {

      editOffer(
        editOfferButton.dataset.editOffer
      );

      return;

    }


    const deleteOfferButton =
      event.target.closest(
        "[data-delete-offer]"
      );


    if (deleteOfferButton) {

      deleteOffer(
        deleteOfferButton.dataset.deleteOffer
      );

      return;

    }


    const editCouponButton =
      event.target.closest(
        "[data-edit-coupon]"
      );


    if (editCouponButton) {

      editCoupon(
        editCouponButton.dataset.editCoupon
      );

      return;

    }


    const deleteCouponButton =
      event.target.closest(
        "[data-delete-coupon]"
      );


    if (deleteCouponButton) {

      deleteCoupon(
        deleteCouponButton.dataset.deleteCoupon
      );

      return;

    }


    const editUserButton =
      event.target.closest(
        "[data-edit-user]"
      );


    if (editUserButton) {

      editUser(
        editUserButton.dataset.editUser
      );

      return;

    }


    const deleteUserButton =
      event.target.closest(
        "[data-delete-user]"
      );


    if (deleteUserButton) {

      deleteUser(
        deleteUserButton.dataset.deleteUser
      );

      return;

    }

  }
);


/* =========================================================
   FORMULARIOS
========================================================= */

$("couponForm")
  ?.addEventListener(
    "submit",
    saveCoupon
  );


$("offerForm")
  ?.addEventListener(
    "submit",
    saveOffer
  );


/* =========================================================
   REFRESCAR
========================================================= */

$("refreshButton")
  ?.addEventListener(
    "click",
    () => {

      loadAllData();

    }
  );


$("refreshUsersButton")
  ?.addEventListener(
    "click",
    () => {

      loadAllData();

    }
  );


/* =========================================================
   BUSCADOR OFERTAS
========================================================= */

$("offerSearch")
  ?.addEventListener(
    "input",
    renderOffers
  );


/* =========================================================
   BUSCADOR CUPONES
========================================================= */

$("couponSearch")
  ?.addEventListener(
    "input",
    renderCoupons
  );


$("couponTypeFilter")
  ?.addEventListener(
    "change",
    renderCoupons
  );


/* =========================================================
   BUSCADOR USUARIOS
========================================================= */

$("userSearch")
  ?.addEventListener(
    "input",
    renderUsers
  );


$("userStatusFilter")
  ?.addEventListener(
    "change",
    renderUsers
  );


/* =========================================================
   BUSCADOR CLICS
========================================================= */

$("clickSearch")
  ?.addEventListener(
    "input",
    renderClicks
  );


/* =========================================================
   PERIODOS ESTADÍSTICAS
========================================================= */

document
  .querySelectorAll(
    ".period-button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".period-button"
            )
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );


          button.classList.add(
            "active"
          );


          renderClicksChart();

        }
      );

    }
  );


/* =========================================================
   IMAGEN BASE64
========================================================= */

function setupImageInput() {

  const input =
    $("offerImage");


  /*
     Tu HTML actual usa un textarea
     para pegar Base64.

     Si posteriormente agregas
     un input type=file,
     también será compatible.
  */

  const fileInputs =
    [
      "offerImageFile",
      "imagenOfertaFile"
    ];


  fileInputs.forEach(
    id => {

      const input =
        $(id);

      if (!input) {

        return;

      }


      input.addEventListener(
        "change",
        () => {

          const file =
            input.files?.[0];


          if (!file) {

            return;

          }


          if (
            file.size >
            900 * 1024
          ) {

            showToast(
              "❌ Imagen demasiado grande. Máximo 900 KB.",
              "error"
            );

            input.value = "";

            return;

          }


          const reader =
            new FileReader();


          reader.onload =
            () => {

              setValue(
                "offerImage",
                reader.result
              );


              showToast(
                "🖼️ Imagen preparada"
              );

            };


          reader.readAsDataURL(
            file
          );

        }
      );

    }
  );

}


/* =========================================================
   AUTO REFRESH
========================================================= */

let autoRefreshTimer =
  null;


function startAutoRefresh() {

  if (
    autoRefreshTimer
  ) {

    clearInterval(
      autoRefreshTimer
    );

  }


  autoRefreshTimer =
    setInterval(
      async () => {

        try {

          await loadAllData(
            true
          );

        } catch (error) {

          console.warn(
            "Auto refresh:",
            error
          );

        }

      },
      60000
    );

}


/* =========================================================
   INICIALIZACIÓN
========================================================= */

async function initAdmin() {

  console.log(
    "⚡ EL PATRÓN ADMIN PRO iniciando..."
  );


  setupImageInput();


  if (!firebaseReady) {

    setFirebaseStatus(
      "error",
      "Error inicializando Firebase"
    );

    showToast(
      "❌ Error inicializando Firebase",
      "error"
    );

    return;

  }


  setFirebaseStatus(
    "loading",
    "Conectando..."
  );


  /*
     IMPORTANTE:

     Esperamos a que Firebase cargue
     pero cada colección tiene su
     propio manejo de errores.
  */

  await loadAllData();


  /*
     Mostramos dashboard inicialmente.
  */

  showSection(
    "dashboard"
  );


  startAutoRefresh();


  console.log(
    "✅ ADMIN PRO listo"
  );

}


/* =========================================================
   INICIAR CUANDO DOM ESTÉ LISTO
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initAdmin
  );

} else {

  initAdmin();

}


/* =========================================================
   EXPONER FUNCIONES
========================================================= */

window.AdminPRO = {

  loadAllData,

  saveOffer,

  saveCoupon,

  saveUser,

  editOffer,

  editCoupon,

  editUser,

  deleteOffer,

  deleteCoupon,

  deleteUser,

  getMostCopiedCoupon,

  getCouponStats,

  getClicksByDay,

  getUsersByState,

  renderCharts,

  renderEverything,

  clearOfferForm,

  clearCouponForm,

  showSection

};


/* =========================================================
   FIN
========================================================= */