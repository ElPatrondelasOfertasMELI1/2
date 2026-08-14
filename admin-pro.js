/* =========================================================
   ⚡ EL PATRÓN DE LAS OFERTAS
   ADMIN PRO v2.2
   =========================================================

   Compatible con:

   admin-pro.html
   admin-pro.css

   FIREBASE:
   Firestore

   CARACTERÍSTICAS:
   - Firestore
   - Sin Firebase Storage
   - Imágenes Base64
   - Galería del teléfono
   - Código de cupón SIEMPRE EN MAYÚSCULAS
   - % de descuento automático
   - Carga independiente de colecciones
   - Un error de colección NO bloquea las demás
   - Eventos seguros después de cargar DOM
========================================================= */


import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  doc
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
   ESTADO FIREBASE
========================================================= */

let app = null;

let db = null;

let firebaseReady = false;


/* =========================================================
   INICIALIZAR FIREBASE
========================================================= */

function initializeFirebase() {

  try {

    app =
      initializeApp(
        firebaseConfig
      );

    db =
      getFirestore(app);

    firebaseReady = true;

    console.log(
      "✅ Firebase inicializado correctamente"
    );

  } catch (error) {

    firebaseReady = false;

    console.error(
      "❌ Error inicializando Firebase:",
      error
    );

  }

}


initializeFirebase();


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

let autoRefreshTimer = null;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {

  return document.getElementById(id);

}


function setText(
  id,
  value
) {

  const element = $(id);

  if (!element) {

    return;

  }

  element.textContent =
    value ?? "";

}


function setValue(
  id,
  value
) {

  const element = $(id);

  if (!element) {

    return;

  }

  element.value =
    value ?? "";

}


function money(value) {

  let number =
    Number(
      String(
        value ?? 0
      )
        .replace(
          /[$,\s]/g,
          ""
        )
    );

  if (
    Number.isNaN(number)
  ) {

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

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function normalize(value) {

  return String(
    value ?? ""
  )
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );

}


/* =========================================================
   NUMEROS
========================================================= */

function numberValue(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return 0;

  }

  const cleaned =
    String(value)
      .replace(
        /[$,\s%]/g,
        ""
      );

  const number =
    Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;

}


/* =========================================================
   CALCULAR DESCUENTO
========================================================= */

function calculateDiscount(
  oldPrice,
  currentPrice
) {

  const oldValue =
    numberValue(oldPrice);

  const currentValue =
    numberValue(currentPrice);

  if (
    oldValue <= 0 ||
    currentValue <= 0 ||
    currentValue >= oldValue
  ) {

    return 0;

  }

  return Math.round(
    (
      1 -
      currentValue /
        oldValue
    ) * 100
  );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message,
  type = "success"
) {

  let toast =
    $("adminToast");

  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "adminToast";

    toast.className =
      "admin-toast";

    document.body.appendChild(
      toast
    );

  }

  toast.textContent =
    message;

  toast.className =
    `admin-toast show ${type}`;

  clearTimeout(
    window.adminToastTimer
  );

  window.adminToastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      3500
    );

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
      typeof value.toDate ===
      "function"
    ) {

      return value.toDate();

    }

    if (
      value.seconds !==
      undefined
    ) {

      return new Date(
        Number(value.seconds) *
        1000
      );

    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return null;

    }

    return date;

  } catch {

    return null;

  }

}


function formatDate(value) {

  const date =
    toDate(value);

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

  const date =
    toDate(value);

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

  const date =
    toDate(value);

  if (!date) {

    return null;

  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

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
   ERROR FIREBASE
========================================================= */

function firebaseErrorMessage(
  error
) {

  if (!error) {

    return "Error desconocido";

  }


  const code =
    error.code ||
    "";


  if (
    code.includes(
      "permission-denied"
    )
  ) {

    return (
      "PERMISOS DE FIRESTORE. " +
      "Las reglas de Firestore no permiten esta operación."
    );

  }


  if (
    code.includes(
      "unauthenticated"
    )
  ) {

    return (
      "Firebase requiere autenticación."
    );

  }


  if (
    code.includes(
      "failed-precondition"
    )
  ) {

    return (
      "Configuración de Firestore incorrecta."
    );

  }


  if (
    code.includes(
      "unavailable"
    )
  ) {

    return (
      "Firebase no está disponible."
    );

  }


  if (
    code.includes(
      "not-found"
    )
  ) {

    return (
      "Documento no encontrado."
    );

  }


  return (
    error.message ||
    "Error desconocido."
  );

}


/* =========================================================
   CARGAR COLECCIÓN SEGURA
========================================================= */

async function safeLoadCollection(
  collectionName
) {

  if (!db) {

    return {

      data: [],

      error:
        new Error(
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

          id:
            item.id,

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
      `❌ Firestore [${collectionName}]`,
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

  if (
    !firebaseReady ||
    !db
  ) {

    setFirebaseStatus(
      "error",
      "Firebase no disponible"
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


  /* OFERTAS */

  const ofertasResult =
    await safeLoadCollection(
      "ofertas"
    );

  ofertas =
    ofertasResult.data;


  /* CUPONES */

  const cuponesResult =
    await safeLoadCollection(
      "cupones"
    );

  cupones =
    cuponesResult.data;


  /* USUARIOS */

  const usuariosResult =
    await safeLoadCollection(
      "usuarios"
    );

  usuarios =
    usuariosResult.data;


  /* COPIAS */

  const copiasResult =
    await safeLoadCollection(
      "copias"
    );

  copias =
    copiasResult.data;


  /* COPIAS DIARIAS */

  if (
    copias.length === 0 &&
    copiasResult.error
  ) {

    const dailyResult =
      await safeLoadCollection(
        "copias_diarias"
      );


    if (
      dailyResult.data.length
    ) {

      copias =
        dailyResult.data;

    }

  }


  const errors =
    Object.values(
      erroresColecciones
    )
      .filter(Boolean);


  if (
    errors.length === 0
  ) {

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
        "⚠️ Información cargada parcialmente",
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
        ([, error]) =>
          error
      );


  if (!errors.length) {

    return;

  }


  console.table(
    errors.map(
      ([collectionName, error]) => ({

        coleccion:
          collectionName,

        codigo:
          error?.code ||
          "",

        mensaje:
          error?.message ||
          ""

      })
    )
  );

}


/* =========================================================
   DASHBOARD
========================================================= */

function calculateSavings() {

  return usuarios.reduce(
    (
      total,
      user
    ) => {

      return (
        total +
        numberValue(
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
    (
      total,
      user
    ) => {

      return (
        total +
        numberValue(
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
    (
      total,
      user
    ) => {

      return (
        total +
        numberValue(
          user.cuponesUsados ||
          0
        )
      );

    },
    0
  );

}


function getCouponCode(
  coupon
) {

  return String(
    coupon?.codigo ||
    coupon?.code ||
    coupon?.cupon ||
    coupon?.codigoCupon ||
    ""
  ).toUpperCase();

}


function getCouponCopies(
  couponCode
) {

  if (!couponCode) {

    return 0;

  }


  const target =
    normalize(
      couponCode
    );


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


  setText(
    "lastUpdate",
    new Date().toLocaleTimeString(
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
        String(
          copy.codigo ||
          copy.cupon ||
          copy.couponCode ||
          copy.code ||
          "SIN CÓDIGO"
        ).toUpperCase();


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
        b.count -
        a.count
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

        <p>
          Aún no hay copias registradas.
        </p>

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
          ${escapeHtml(
            top.code
          )}
        </strong>

        <span>
          ${top.count}
          ${
            top.count === 1
              ? "copia"
              : "copias"
          }
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
            (
              dbb?.getTime() ||
              0
            ) -
            (
              da?.getTime() ||
              0
            )
          );

        }
      )
      .slice(
        0,
        8
      );


  if (!recent.length) {

    container.innerHTML = `

      <div class="empty-state-small">

        <span>⚡</span>

        <p>
          No hay actividad reciente.
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML =
    recent
      .map(
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
                  ${escapeHtml(
                    String(code)
                      .toUpperCase()
                  )}
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


  const data =
    ofertas.filter(
      offer => {

        if (!search) {

          return true;

        }


        return normalize(
          `
          ${offer.titulo || ""}
          ${offer.categoria || ""}
          ${offer.link || ""}
          `
        ).includes(
          search
        );

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
    data
      .map(
        offer => {

          const oldPrice =
            numberValue(
              offer.precioAntes ||
              offer.precioAnterior ||
              0
            );


          const currentPrice =
            numberValue(
              offer.precioActual ||
              offer.precio ||
              offer.currentPrice ||
              0
            );


          const discount =
            calculateDiscount(
              oldPrice,
              currentPrice
            );


          const clicks =
            numberValue(
              offer.clics ||
              offer.clicks ||
              0
            );


          const image =
            offer.imagenBase64 ||
            offer.imagen ||
            "";


          return `

            <tr>

              <td>

                <div class="table-product">

                  <div class="table-product-image">

                    ${
                      image
                        ? `
                          <img
                            src="${escapeHtml(
                              image
                            )}"
                            alt=""
                            loading="lazy"
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
                    ? money(
                        oldPrice
                      )
                    : "—"
                }
              </td>

              <td>

                <strong>
                  ${money(
                    currentPrice
                  )}
                </strong>

              </td>

              <td>

                ${
                  discount > 0
                    ? `
                      <span class="discount-badge">
                        -${discount}%
                      </span>
                    `
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

      text:
        "🔴 Agotado",

      className:
        "expired"

    };

  }


  if (
    status.includes("por")
  ) {

    return {

      text:
        "🟠 Por agotarse",

      className:
        "warning"

    };

  }


  return {

    text:
      "🟢 Activo",

    className:
      "active"

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


  const data =
    cupones.filter(
      coupon => {

        const text =
          normalize(
            `
            ${getCouponCode(coupon)}
            ${coupon.titulo || ""}
            ${coupon.descuento || ""}
            ${coupon.banco || ""}
            `
          );


        if (
          search &&
          !text.includes(
            search
          )
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
    data
      .map(
        coupon => {

          const code =
            getCouponCode(
              coupon
            );


          const status =
            couponStatus(
              coupon
            );


          const copies =
            getCouponCopies(
              code
            );


          const minimum =
            coupon.compraMinima ??
            coupon.minimo ??
            coupon.minimum ??
            0;


          const maximum =
            coupon.tope ??
            coupon.maximo ??
            coupon.maximum ??
            0;


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
                ${couponTypeLabel(
                  coupon
                )}
              </td>

              <td>
                ${escapeHtml(
                  coupon.descuento ||
                  "—"
                )}
              </td>

              <td>
                ${
                  numberValue(
                    minimum
                  )
                    ? money(
                        minimum
                      )
                    : "—"
                }
              </td>

              <td>
                ${
                  numberValue(
                    maximum
                  )
                    ? money(
                        maximum
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
   ESTADÍSTICAS CUPONES
========================================================= */

function updateCouponMiniStats() {

  let active = 0;

  let warning = 0;

  let expired = 0;

  let copies = 0;


  cupones.forEach(
    coupon => {

      const status =
        couponStatus(
          coupon
        );


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
          getCouponCode(
            coupon
          )
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
            `
            ${user.nombre || ""}
            ${user.email || ""}
            ${user.estado || ""}
            ${user.estadoVerificacion || ""}
            `
          );


        if (
          search &&
          !text.includes(
            search
          )
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
    data
      .map(
        user => {

          const status =
            userStatus(
              user
            );


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
                            loading="lazy"
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
                    status ===
                    "verificado"
                      ? "active"
                      : status ===
                        "rechazado"
                        ? "expired"
                        : "warning"
                  }"
                >

                  ${
                    status ===
                    "verificado"
                      ? "✅ Verificado"
                      : status ===
                        "rechazado"
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
                ${numberValue(
                  user.compras ||
                  0
                )}
              </td>

              <td>
                ${numberValue(
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
   ESTADÍSTICAS USUARIOS
========================================================= */

function updateUserStats() {

  let verified = 0;

  let pending = 0;

  let savings = 0;


  usuarios.forEach(
    user => {

      const status =
        userStatus(
          user
        );


      if (
        status ===
        "verificado"
      ) {

        verified++;

      } else if (
        status ===
        "pendiente"
      ) {

        pending++;

      }


      savings +=
        numberValue(
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

  setText(
    "performanceClicks",
    copias.length
  );

  setText(
    "performanceCoupons",
    calculateUsedCoupons()
  );

  setText(
    "performanceUsers",
    usuarios.length
  );

  setText(
    "performanceSavings",
    money(
      calculateSavings()
    )
  );

  setText(
    "performancePurchases",
    calculatePurchases()
  );


  renderCouponRanking();

  renderStateList();

  renderCharts();

}


/* =========================================================
   RANKING CUPONES
========================================================= */

function renderCouponRanking() {

  const container =
    $("couponRankingList");


  if (!container) {

    return;

  }


  const stats =
    getCouponStats()
      .slice(
        0,
        10
      );


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
    stats
      .map(
        (
          item,
          index
        ) => {

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
      .slice(
        0,
        10
      );


  if (!states.length) {

    container.innerHTML = "";

    return;

  }


  container.innerHTML =
    states
      .map(
        ([state, count]) => {

          return `

            <div class="state-row">

              <span>
                ${escapeHtml(
                  state
                )}
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
      .slice(
        -30
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

        type:
          "line",

        data: {

          labels:
            entries.map(
              ([date]) => {

                const parts =
                  date.split("-");

                return `${parts[2]}/${parts[1]}`;

              }
            ),

          datasets: [

            {

              label:
                "Clics",

              data:
                entries.map(
                  ([, value]) =>
                    value
                ),

              tension:
                0.35,

              fill:
                true

            }

          ]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          plugins: {

            legend: {

              display:
                false

            }

          },

          scales: {

            y: {

              beginAtZero:
                true,

              ticks: {

                precision:
                  0

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
      .slice(
        0,
        10
      );


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

        type:
          "doughnut",

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

          responsive:
            true,

          maintainAspectRatio:
            false,

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


        return normalize(
          `
          ${copy.codigo || ""}
          ${copy.cupon || ""}
          ${copy.couponCode || ""}
          ${copy.usuario || ""}
          ${copy.nombre || ""}
          ${copy.email || ""}
          `
        ).includes(
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
          (
            dbb?.getTime() ||
            0
          ) -
          (
            da?.getTime() ||
            0
          )
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
    data
      .map(
        copy => {

          const code =
            String(
              copy.codigo ||
              copy.cupon ||
              copy.couponCode ||
              copy.code ||
              "—"
            ).toUpperCase();


          const user =
            copy.usuario ||
            copy.nombre ||
            copy.email ||
            "Usuario";


          return `

            <tr>

              <td>

                <strong>
                  ${escapeHtml(
                    code
                  )}
                </strong>

              </td>

              <td>
                ${escapeHtml(
                  user
                )}
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
   RANKING
========================================================= */

function renderRanking() {

  const body =
    $("rankingTableBody");

  const grid =
    $("rankingGrid");


  const ranked =
    [...usuarios].sort(
      (a, b) =>
        numberValue(
          b.ahorroTotal ||
          b.ahorro ||
          0
        ) -
        numberValue(
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
          .slice(
            0,
            3
          )
          .map(
            (
              user,
              index
            ) => {

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
    ranked
      .map(
        (
          user,
          index
        ) => {

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
                ${numberValue(
                  user.compras ||
                  0
                )}
              </td>

              <td>
                ${numberValue(
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

    breadcrumb:
      "Dashboard",

    title:
      "Panel de control"

  },

  ofertas: {

    breadcrumb:
      "Contenido",

    title:
      "🔥 Ofertas"

  },

  cupones: {

    breadcrumb:
      "Cupones",

    title:
      "🎟️ Administración de cupones"

  },

  usuarios: {

    breadcrumb:
      "Comunidad",

    title:
      "👥 Usuarios"

  },

  estadisticas: {

    breadcrumb:
      "Analítica",

    title:
      "📈 Estadísticas"

  },

  clics: {

    breadcrumb:
      "Actividad",

    title:
      "👆 Clics y copias"

  },

  ranking: {

    breadcrumb:
      "Comunidad",

    title:
      "🏆 Comprador del mes"

  },

  configuracion: {

    breadcrumb:
      "Sistema",

    title:
      "⚙️ Configuración"

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
    sectionNames[
      section
    ] ||
    sectionNames.dashboard;


  setText(
    "breadcrumb",
    info.breadcrumb
  );

  setText(
    "pageTitle",
    info.title
  );


  if (
    section ===
    "clics"
  ) {

    renderClicks();

  }


  if (
    section ===
    "ranking"
  ) {

    renderRanking();

  }


  if (
    section ===
    "estadisticas"
  ) {

    setTimeout(
      renderCharts,
      50
    );

  }


  closeMobileMenu();

}


/* =========================================================
   MENÚ MÓVIL
========================================================= */

function openMobileMenu() {

  const sidebar =
    $("sidebar");

  const overlay =
    $("sidebarOverlay");


  sidebar?.classList.add(
    "open"
  );

  overlay?.classList.add(
    "show"
  );

}


function closeMobileMenu() {

  const sidebar =
    $("sidebar");

  const overlay =
    $("sidebarOverlay");


  sidebar?.classList.remove(
    "open"
  );

  overlay?.classList.remove(
    "show"
  );

}


/* =========================================================
   MODALES
========================================================= */

function openModal(
  id
) {

  const modal =
    $(id);


  if (!modal) {

    console.warn(
      `Modal no encontrado: ${id}`
    );

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


/* =========================================================
   FORMULARIO CUPÓN
========================================================= */

function clearCouponForm() {

  currentCouponId =
    null;


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


  setValue(
    "couponCode",
    ""
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


/* =========================================================
   FORMULARIO OFERTA
========================================================= */

function clearOfferForm() {

  currentOfferId =
    null;


  const form =
    $("offerForm");


  if (form) {

    form.reset();

  }


  setValue(
    "offerImage",
    ""
  );


  setText(
    "offerFormMessage",
    ""
  );


  clearImagePreview();

}


/* =========================================================
   CUPÓN - MAYÚSCULAS EN TIEMPO REAL
========================================================= */

function setupCouponUppercase() {

  const input =
    $("couponCode");


  if (!input) {

    return;

  }


  input.addEventListener(
    "input",
    () => {

      const start =
        input.selectionStart;

      const end =
        input.selectionEnd;


      input.value =
        input.value
          .toUpperCase();


      try {

        input.setSelectionRange(
          start,
          end
        );

      } catch {}

    }
  );


  input.addEventListener(
    "blur",
    () => {

      input.value =
        input.value
          .trim()
          .toUpperCase();

    }
  );

}


/* =========================================================
   NUEVO CUPÓN
========================================================= */

function setupNewCouponButton() {

  const button =
    $("newCouponButton");


  if (!button) {

    return;

  }


  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      clearCouponForm();

      openModal(
        "couponModal"
      );

    }
  );

}


/* =========================================================
   NUEVA OFERTA
========================================================= */

function setupNewOfferButton() {

  const button =
    $("newOfferButton");


  if (!button) {

    return;

  }


  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      clearOfferForm();

      openModal(
        "offerModal"
      );

    }
  );

}


/* =========================================================
   EDITAR CUPÓN
========================================================= */

function editCoupon(
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
    getCouponCode(
      coupon
    )
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

    type =
      "bank";

  } else if (
    type.includes("exclus")
  ) {

    type =
      "exclusive";

  } else {

    type =
      "flash";

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

  event?.preventDefault();


  if (!db) {

    showToast(
      "❌ Firebase no está disponible",
      "error"
    );

    return;

  }


  const code =
    String(
      $("couponCode")?.value ||
      ""
    )
      .trim()
      .toUpperCase();


  const title =
    String(
      $("couponTitle")?.value ||
      ""
    )
      .trim();


  /* Siempre dejamos el input
     visualmente en mayúsculas */

  setValue(
    "couponCode",
    code
  );


  if (
    !code ||
    !title
  ) {

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

    codigo:
      code,

    titulo:
      title,

    descuento:
      String(
        $("couponDiscount")?.value ||
        ""
      ).trim(),

    tipo:
      type,

    compraMinima:
      numberValue(
        $("couponMinimum")?.value
      ),

    tope:
      numberValue(
        $("couponMaximum")?.value
      ),

    estado:
      $("couponStatus")?.value ||
      "activo",

    categoria:
      String(
        $("couponCategory")?.value ||
        ""
      ).trim() ||
      "General",

    link:
      String(
        $("couponLink")?.value ||
        ""
      ).trim(),

    banco:
      String(
        $("couponBank")?.value ||
        ""
      ).trim(),

    actualizado:
      serverTimestamp()

  };


  try {

    if (
      currentCouponId
    ) {

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
        "✅ Cupón guardado"
      );

    }


    closeModal(
      "couponModal"
    );


    currentCouponId =
      null;


    await loadAllData(
      true
    );

  } catch (error) {

    console.error(
      "❌ Guardar cupón:",
      error
    );


    if (
      error?.code ===
      "permission-denied"
    ) {

      showToast(
        "❌ Firestore rechazó guardar el cupón por PERMISOS",
        "error"
      );

    } else {

      showToast(
        `❌ No se pudo guardar: ${
          firebaseErrorMessage(
            error
          )
        }`,
        "error"
      );

    }

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


  updateOfferDiscountPreview();

  updateImagePreview(
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

  event?.preventDefault();


  if (!db) {

    showToast(
      "❌ Firebase no está disponible",
      "error"
    );

    return;

  }


  const title =
    String(
      $("offerTitle")?.value ||
      ""
    ).trim();


  const currentPrice =
    numberValue(
      $("offerCurrentPrice")?.value
    );


  const oldPrice =
    numberValue(
      $("offerOldPrice")?.value
    );


  const category =
    String(
      $("offerCategory")?.value ||
      ""
    ).trim() ||
    "General";


  const link =
    String(
      $("offerLink")?.value ||
      ""
    ).trim();


  const image =
    String(
      $("offerImage")?.value ||
      ""
    ).trim();


  if (!title) {

    showToast(
      "❌ Escribe el título",
      "error"
    );

    return;

  }


  if (
    currentPrice <= 0
  ) {

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


  const discount =
    calculateDiscount(
      oldPrice,
      currentPrice
    );


  const data = {

    titulo:
      title,

    precioAntes:
      oldPrice,

    precioActual:
      currentPrice,

    descuento:
      discount,

    descuentoPorcentaje:
      discount,

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

    if (
      currentOfferId
    ) {

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

      data.clics =
        0;


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


    currentOfferId =
      null;


    await loadAllData(
      true
    );

  } catch (error) {

    console.error(
      "❌ Guardar oferta:",
      error
    );


    showToast(
      `❌ No se pudo guardar: ${
        firebaseErrorMessage(
          error
        )
      }`,
      "error"
    );

  }

}


/* =========================================================
   PREVIEW % DESCUENTO
========================================================= */

function updateOfferDiscountPreview() {

  const oldPrice =
    numberValue(
      $("offerOldPrice")?.value
    );


  const currentPrice =
    numberValue(
      $("offerCurrentPrice")?.value
    );


  const discount =
    calculateDiscount(
      oldPrice,
      currentPrice
    );


  const elements = [

    "offerDiscount",

    "offerDiscountPreview",

    "discountPreview"

  ];


  elements.forEach(
    id => {

      const element =
        $(id);


      if (!element) {

        return;

      }


      element.textContent =
        discount > 0
          ? `-${discount}%`
          : "0%";

    }
  );

}


/* =========================================================
   PREVIEW IMAGEN
========================================================= */

function updateImagePreview(
  src
) {

  if (!src) {

    clearImagePreview();

    return;

  }


  const possibleIds = [

    "offerImagePreview",

    "imagePreview",

    "offerPreviewImage",

    "previewOfferImage"

  ];


  let found = false;


  possibleIds.forEach(
    id => {

      const element =
        $(id);


      if (!element) {

        return;

      }


      found = true;


      if (
        element.tagName ===
        "IMG"
      ) {

        element.src =
          src;

        element.style.display =
          "block";

      } else {

        element.innerHTML = `

          <img
            src="${escapeHtml(
              src
            )}"
            alt="Vista previa"
            style="
              max-width:100%;
              max-height:220px;
              object-fit:contain;
              border-radius:14px;
            "
          >

        `;

      }

    }
  );


  return found;

}


function clearImagePreview() {

  const possibleIds = [

    "offerImagePreview",

    "imagePreview",

    "offerPreviewImage",

    "previewOfferImage"

  ];


  possibleIds.forEach(
    id => {

      const element =
        $(id);


      if (!element) {

        return;

      }


      if (
        element.tagName ===
        "IMG"
      ) {

        element.removeAttribute(
          "src"
        );

        element.style.display =
          "none";

      } else {

        element.innerHTML =
          "";

      }

    }
  );

}


/* =========================================================
   IMAGEN DESDE GALERÍA
========================================================= */

function createGalleryInput() {

  let input =
    $("offerImageFile");


  if (input) {

    return input;

  }


  input =
    document.createElement(
      "input"
    );


  input.type =
    "file";

  input.id =
    "offerImageFile";

  input.accept =
    "image/*";

  input.style.display =
    "none";


  document.body.appendChild(
    input
  );


  return input;

}


/* =========================================================
   COMPRIMIR IMAGEN
========================================================= */

function compressImage(
  file,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.78
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const reader =
        new FileReader();


      reader.onerror =
        () => {

          reject(
            new Error(
              "No se pudo leer la imagen."
            )
          );

        };


      reader.onload =
        () => {

          const image =
            new Image();


          image.onerror =
            () => {

              reject(
                new Error(
                  "La imagen no es válida."
                )
              );

            };


          image.onload =
            () => {

              let width =
                image.width;

              let height =
                image.height;


              const ratio =
                Math.min(
                  maxWidth /
                    width,
                  maxHeight /
                    height,
                  1
                );


              width =
                Math.round(
                  width * ratio
                );


              height =
                Math.round(
                  height * ratio
                );


              const canvas =
                document.createElement(
                  "canvas"
                );


              canvas.width =
                width;

              canvas.height =
                height;


              const context =
                canvas.getContext(
                  "2d"
                );


              context.drawImage(
                image,
                0,
                0,
                width,
                height
              );


              const result =
                canvas.toDataURL(
                  "image/jpeg",
                  quality
                );


              resolve(
                result
              );

            };


          image.src =
            reader.result;

        };


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* =========================================================
   PROCESAR GALERÍA
========================================================= */

async function handleGalleryImage(
  input
) {

  const file =
    input?.files?.[0];


  if (!file) {

    return;

  }


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    showToast(
      "❌ Selecciona una imagen",
      "error"
    );

    input.value =
      "";

    return;

  }


  /*
     Permitimos imágenes grandes
     porque las comprimimos antes
     de guardarlas.
  */

  if (
    file.size >
    15 * 1024 * 1024
  ) {

    showToast(
      "❌ La imagen supera 15 MB",
      "error"
    );

    input.value =
      "";

    return;

  }


  try {

    showToast(
      "🖼️ Preparando imagen..."
    );


    const base64 =
      await compressImage(
        file
      );


    setValue(
      "offerImage",
      base64
    );


    updateImagePreview(
      base64
    );


    showToast(
      "✅ Imagen lista"
    );

  } catch (error) {

    console.error(
      error
    );


    showToast(
      "❌ No se pudo procesar la imagen",
      "error"
    );

  }

}


/* =========================================================
   CONFIGURAR GALERÍA
========================================================= */

function setupImageInput() {

  let input =
    $("offerImageFile");


  /*
     Si el HTML ya tiene
     offerImageFile lo utilizamos.

     Si no existe, creamos uno
     automáticamente.
  */

  if (!input) {

    input =
      createGalleryInput();

  }


  if (!input) {

    return;

  }


  /*
     Evitar registrar el evento
     dos veces.
  */

  if (
    input.dataset.adminReady ===
    "1"
  ) {

    return;

  }


  input.dataset.adminReady =
    "1";


  input.addEventListener(
    "change",
    () => {

      handleGalleryImage(
        input
      );

    }
  );


  /*
     También soportamos
     imagenOfertaFile.
  */

  const secondInput =
    $("imagenOfertaFile");


  if (
    secondInput &&
    secondInput !== input
  ) {

    secondInput.addEventListener(
      "change",
      () => {

        handleGalleryImage(
          secondInput
        );

      }
    );

  }


  /*
     Si existe un botón de
     seleccionar imagen, lo conectamos.
  */

  const galleryButtons = [

    "selectOfferImage",

    "selectImageButton",

    "offerGalleryButton",

    "chooseOfferImage",

    "galleryImageButton"

  ];


  galleryButtons.forEach(
    id => {

      const button =
        $(id);


      if (!button) {

        return;

      }


      button.addEventListener(
        "click",
        event => {

          event.preventDefault();

          input.click();

        }
      );

    }
  );

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
          ${numberValue(
            user.compras ||
            0
          )}
        </strong>
      </p>

      <p>
        🎟️ Cupones usados:
        <strong>
          ${numberValue(
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

  event?.preventDefault();

}


/* =========================================================
   ELIMINAR OFERTA
========================================================= */

async function deleteOffer(
  id
) {

  if (!db) {

    showToast(
      "❌ Firebase no está disponible",
      "error"
    );

    return;

  }


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
      "Eliminar oferta:",
      error
    );


    showToast(
      `❌ No se pudo eliminar: ${
        firebaseErrorMessage(
          error
        )
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

  if (!db) {

    showToast(
      "❌ Firebase no está disponible",
      "error"
    );

    return;

  }


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


  const code =
    getCouponCode(
      coupon
    );


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
      "❌ Eliminar cupón:",
      error
    );


    if (
      error?.code ===
      "permission-denied"
    ) {

      showToast(
        "❌ Firestore rechazó eliminar el cupón por PERMISOS",
        "error"
      );

    } else {

      showToast(
        `❌ No se pudo eliminar: ${
          firebaseErrorMessage(
            error
          )
        }`,
        "error"
      );

    }

  }

}


/* =========================================================
   ELIMINAR USUARIO
========================================================= */

async function deleteUser(
  id
) {

  if (!db) {

    showToast(
      "❌ Firebase no está disponible",
      "error"
    );

    return;

  }


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
      "Eliminar usuario:",
      error
    );


    showToast(
      `❌ No se pudo eliminar: ${
        firebaseErrorMessage(
          error
        )
      }`,
      "error"
    );

  }

}


/* =========================================================
   EVENTOS DE TABLAS
========================================================= */

function setupTableEvents() {

  /*
     Delegación de eventos.

     Esto es importante porque las filas
     se generan dinámicamente después
     de cargar Firestore.
  */

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

}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function setupNavigationEvents() {

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

}


/* =========================================================
   MODALES
========================================================= */

function setupModalEvents() {

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

}


/* =========================================================
   MENÚ MÓVIL
========================================================= */

function setupMobileMenuEvents() {

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

}


/* =========================================================
   FORMULARIOS
========================================================= */

function setupFormEvents() {

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

}


/* =========================================================
   BUSCADORES
========================================================= */

function setupSearchEvents() {

  $("offerSearch")
    ?.addEventListener(
      "input",
      renderOffers
    );


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


  $("clickSearch")
    ?.addEventListener(
      "input",
      renderClicks
    );

}


/* =========================================================
   REFRESCAR
========================================================= */

function setupRefreshEvents() {

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

}


/* =========================================================
   PREVIEW PRECIO OFERTA
========================================================= */

function setupOfferPriceEvents() {

  $("offerOldPrice")
    ?.addEventListener(
      "input",
      updateOfferDiscountPreview
    );


  $("offerCurrentPrice")
    ?.addEventListener(
      "input",
      updateOfferDiscountPreview
    );


  $("offerImage")
    ?.addEventListener(
      "input",
      () => {

        updateImagePreview(
          $("offerImage")?.value
        );

      }
    );

}


/* =========================================================
   PERIODOS
========================================================= */

function setupPeriodEvents() {

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

}


/* =========================================================
   AUTO REFRESH
========================================================= */

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
   CONFIGURAR TODOS LOS EVENTOS
========================================================= */

function setupAllEvents() {

  /*
     AQUÍ ESTÁ UNA DE LAS CORRECCIONES
     IMPORTANTES DE ESTA VERSIÓN.

     Todos los eventos se registran
     DESPUÉS de que el DOM existe.
  */


  setupNavigationEvents();

  setupMobileMenuEvents();

  setupModalEvents();

  setupTableEvents();

  setupFormEvents();

  setupSearchEvents();

  setupRefreshEvents();

  setupPeriodEvents();

  setupNewCouponButton();

  setupNewOfferButton();

  setupCouponUppercase();

  setupImageInput();

  setupOfferPriceEvents();

}


/* =========================================================
   INICIALIZACIÓN
========================================================= */

async function initAdmin() {

  console.log(
    "⚡ EL PATRÓN ADMIN PRO v2.2 iniciando..."
  );


  setupAllEvents();


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


  await loadAllData();


  showSection(
    "dashboard"
  );


  startAutoRefresh();


  console.log(
    "✅ ADMIN PRO listo"
  );

}


/* =========================================================
   DOM READY
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initAdmin,
    {
      once: true
    }
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

  showSection,

  calculateDiscount,

  updateOfferDiscountPreview,

  handleGalleryImage

};


/* =========================================================
   FIN
========================================================= */