/* =========================================================
   ⚡ EL PATRÓN DE LAS OFERTAS
   ADMIN PRO
   =========================================================

   ARCHIVO:
   admin-pro.js

   COMPATIBLE CON:
   admin-pro.html
   admin-pro.css

   FIREBASE:
   Firestore
   SIN Firebase Storage

   FUNCIONES:
   - Ofertas
   - Cupones
   - Usuarios
   - Estadísticas
   - Copias de cupones
   - Cupón más copiado
   - Clics por día
   - Usuarios por estado
   - Ahorro total
   - Compras
   - Cupones usados
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
  setDoc,
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
   INICIALIZAR
========================================================= */

const app =
  initializeApp(
    firebaseConfig
  );


const db =
  getFirestore(
    app
  );


/* =========================================================
   VARIABLES
========================================================= */

let ofertas = [];

let cupones = [];

let usuarios = [];

let copias = [];

let estadisticas = {};

let currentOfferId = null;

let currentCouponId = null;

let currentUserId = null;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {

  return document.getElementById(
    id
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
      3000
    );

}


/* =========================================================
   FORMATO DINERO
========================================================= */

function money(
  value
) {

  const number =
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
    Number.isNaN(
      number
    )
  ) {

    return "$0";

  }


  return number.toLocaleString(
    "es-MX",
    {
      style:
        "currency",

      currency:
        "MXN",

      maximumFractionDigits:
        0

    }
  );

}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(
  value
) {

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


/* =========================================================
   FECHA
========================================================= */

function formatDate(
  timestamp
) {

  if (!timestamp) {

    return "Sin fecha";

  }


  try {

    let date;


    if (
      timestamp.toDate
    ) {

      date =
        timestamp.toDate();

    } else {

      date =
        new Date(
          timestamp
        );

    }


    return date.toLocaleDateString(
      "es-MX",
      {
        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric"

      }
    );

  } catch {

    return "Sin fecha";

  }

}


/* =========================================================
   FECHA YYYY-MM-DD
========================================================= */

function dateKey(
  timestamp
) {

  if (!timestamp) {

    return null;

  }


  try {

    let date;


    if (
      timestamp.toDate
    ) {

      date =
        timestamp.toDate();

    } else {

      date =
        new Date(
          timestamp
        );

    }


    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() + 1
      )
        .padStart(
          2,
          "0"
        );


    const day =
      String(
        date.getDate()
      )
        .padStart(
          2,
          "0"
        );


    return `${year}-${month}-${day}`;

  } catch {

    return null;

  }

}


/* =========================================================
   CARGAR COLECCIÓN
========================================================= */

async function loadCollection(
  name
) {

  const snapshot =
    await getDocs(
      collection(
        db,
        name
      )
    );


  const result =
    [];


  snapshot.forEach(
    item => {

      result.push({

        id:
          item.id,

        ...item.data()

      });

    }
  );


  return result;

}


/* =========================================================
   CARGAR TODO
========================================================= */

async function loadAllData() {

  try {

    showToast(
      "🔄 Cargando información..."
    );


    const [
      ofertasData,
      cuponesData,
      usuariosData,
      copiasData
    ] =
      await Promise.all([

        loadCollection(
          "ofertas"
        ),

        loadCollection(
          "cupones"
        ),

        loadCollection(
          "usuarios"
        ),

        loadCollection(
          "copias"
        )

      ]);


    ofertas =
      ofertasData;


    cupones =
      cuponesData;


    usuarios =
      usuariosData;


    copias =
      copiasData;


    renderEverything();


    showToast(
      "✅ Información actualizada"
    );


  } catch (
    error
  ) {

    console.error(
      error
    );


    showToast(
      "❌ Error cargando Firebase",
      "error"
    );

  }

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

  renderCharts();

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

  const totalOffers =
    ofertas.length;


  const activeCoupons =
    cupones.filter(
      coupon =>
        !String(
          coupon.estado ||
          "activo"
        )
          .toLowerCase()
          .includes(
            "agot"
          )
    ).length;


  const totalUsers =
    usuarios.length;


  const totalClicks =
    copias.length;


  const ahorro =
    usuarios.reduce(
      (
        total,
        user
      ) => {

        return (
          total +
          Number(
            user.ahorroTotal ||
            0
          )
        );

      },
      0
    );


  const compras =
    usuarios.reduce(
      (
        total,
        user
      ) => {

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


  const cuponesUsados =
    usuarios.reduce(
      (
        total,
        user
      ) => {

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


  setText(
    [
      "totalOffers",
      "statOffers",
      "dashboardOffers"
    ],
    totalOffers
  );


  setText(
    [
      "activeCoupons",
      "statCoupons",
      "dashboardCoupons"
    ],
    activeCoupons
  );


  setText(
    [
      "totalUsers",
      "statUsers",
      "dashboardUsers"
    ],
    totalUsers
  );


  setText(
    [
      "totalClicks",
      "statClicks",
      "dashboardClicks"
    ],
    totalClicks
  );


  setText(
    [
      "totalSavings",
      "statSavings"
    ],
    money(
      ahorro
    )
  );


  setText(
    [
      "totalPurchases",
      "statPurchases"
    ],
    compras
  );


  setText(
    [
      "totalCouponsUsed",
      "statCouponsUsed"
    ],
    cuponesUsados
  );

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
  ids,
  value
) {

  ids.forEach(
    id => {

      const element =
        $(id);


      if (element) {

        element.textContent =
          value;

      }

    }
  );

}


/* =========================================================
   OFERTAS
========================================================= */

function renderOffers() {

  const container =
    $(
      "offersList"
    ) ||
    $(
      "offersContainer"
    ) ||
    $(
      "offersTable"
    );


  if (!container) {

    return;

  }


  if (!ofertas.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div>🔥</div>
        <strong>No hay ofertas</strong>
        <span>Agrega tu primera oferta.</span>
      </div>
    `;

    return;

  }


  container.innerHTML =
    ofertas
      .map(
        offer => {

          const before =
            Number(
              offer.precioAntes ||
              0
            );


          const current =
            Number(
              offer.precioActual ||
              0
            );


          let discount =
            0;


          if (
            before > 0 &&
            current > 0 &&
            current < before
          ) {

            discount =
              Math.round(
                (
                  1 -
                  current /
                    before
                ) *
                100
              );

          }


          return `

            <article
              class="admin-offer-card"
              data-id="${offer.id}"
            >

              <div class="admin-offer-image">

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
                    : `
                      <span>
                        🔥
                      </span>
                    `
                }

              </div>

              <div class="admin-offer-info">

                <small>
                  ${escapeHtml(
                    offer.categoria ||
                    "Oferta"
                  )}
                </small>

                <h3>
                  ${escapeHtml(
                    offer.titulo ||
                    "Sin título"
                  )}
                </h3>

                <div class="admin-prices">

                  ${
                    before
                      ? `
                        <del>
                          ${money(
                            before
                          )}
                        </del>
                      `
                      : ""
                  }

                  <strong>
                    ${money(
                      current
                    )}
                  </strong>

                </div>

                ${
                  discount
                    ? `
                      <span class="discount-badge">
                        -${discount}%
                      </span>
                    `
                    : ""
                }

                <div class="admin-actions">

                  <button
                    type="button"
                    data-edit-offer="${offer.id}"
                  >
                    ✏️ Editar
                  </button>

                  <button
                    type="button"
                    data-delete-offer="${offer.id}"
                    class="danger"
                  >
                    🗑️ Eliminar
                  </button>

                </div>

              </div>

            </article>

          `;

        }
      )
      .join("");

}


/* =========================================================
   CUPONES
========================================================= */

function renderCoupons() {

  const container =
    $(
      "couponsList"
    ) ||
    $(
      "couponsContainer"
    ) ||
    $(
      "couponsTable"
    );


  if (!container) {

    return;

  }


  if (!cupones.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div>🎟️</div>
        <strong>No hay cupones</strong>
        <span>Agrega un cupón desde el administrador.</span>
      </div>
    `;

    return;

  }


  container.innerHTML =
    cupones
      .map(
        coupon => {

          const code =
            coupon.codigo ||
            coupon.code ||
            "";


          const copies =
            getCouponCopies(
              code
            );


          const estado =
            String(
              coupon.estado ||
              "activo"
            )
              .toLowerCase();


          let statusClass =
            "active";


          if (
            estado.includes(
              "agot"
            )
          ) {

            statusClass =
              "expired";

          } else if (
            estado.includes(
              "por"
            )
          ) {

            statusClass =
              "warning";

          }


          return `

            <article
              class="admin-coupon-card"
              data-id="${coupon.id}"
            >

              <div class="coupon-admin-top">

                <span>
                  ${
                    coupon.tipo ===
                    "bancario"
                      ? "🏦"
                      : "🎟️"
                  }
                </span>

                <span
                  class="status-badge ${statusClass}"
                >
                  ${escapeHtml(
                    coupon.estado ||
                    "ACTIVO"
                  )}
                </span>

              </div>

              <div class="coupon-admin-code">

                ${escapeHtml(
                  code ||
                  "SIN CÓDIGO"
                )}

              </div>

              <h3>
                ${escapeHtml(
                  coupon.titulo ||
                  coupon.nombre ||
                  "Cupón"
                )}
              </h3>

              <div class="coupon-admin-data">

                <span>
                  💰 ${
                    escapeHtml(
                      coupon.descuento ||
                      ""
                    )
                  }
                </span>

                <span>
                  📋 ${copies} copias
                </span>

              </div>

              <div class="admin-actions">

                <button
                  type="button"
                  data-edit-coupon="${coupon.id}"
                >
                  ✏️ Editar
                </button>

                <button
                  type="button"
                  data-delete-coupon="${coupon.id}"
                  class="danger"
                >
                  🗑️ Eliminar
                </button>

              </div>

            </article>

          `;

        }
      )
      .join("");

}


/* =========================================================
   USUARIOS
========================================================= */

function renderUsers() {

  const container =
    $(
      "usersList"
    ) ||
    $(
      "usersContainer"
    ) ||
    $(
      "usersTable"
    );


  if (!container) {

    return;

  }


  if (!usuarios.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div>👤</div>
        <strong>No hay usuarios</strong>
        <span>Los usuarios registrados aparecerán aquí.</span>
      </div>
    `;

    return;

  }


  container.innerHTML =
    usuarios
      .map(
        user => {

          return `

            <article
              class="admin-user-card"
              data-id="${user.id}"
            >

              <div class="user-avatar">

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

              <div class="user-info">

                <h3>
                  ${escapeHtml(
                    user.nombre ||
                    "Sin nombre"
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    user.email ||
                    ""
                  )}
                </p>

                <p>
                  📍 ${
                    escapeHtml(
                      user.estado ||
                      "Estado no registrado"
                    )
                  }
                </p>

              </div>

              <div class="user-stats">

                <strong>
                  ${money(
                    user.ahorroTotal ||
                    0
                  )}
                </strong>

                <span>
                  Ahorro
                </span>

                <strong>
                  ${
                    Number(
                      user.compras ||
                      0
                    )
                  }
                </strong>

                <span>
                  Compras
                </span>

                <strong>
                  ${
                    Number(
                      user.cuponesUsados ||
                      0
                    )
                  }
                </strong>

                <span>
                  Cupones
                </span>

              </div>

              <div class="admin-actions">

                <button
                  type="button"
                  data-edit-user="${user.id}"
                >
                  ✏️ Editar
                </button>

                <button
                  type="button"
                  data-delete-user="${user.id}"
                  class="danger"
                >
                  🗑️ Eliminar
                </button>

              </div>

            </article>

          `;

        }
      )
      .join("");

}


/* =========================================================
   COPIAS POR CUPÓN
========================================================= */

function getCouponCopies(
  code
) {

  if (!code) {

    return 0;

  }


  return copias.filter(
    item =>
      String(
        item.codigo ||
        item.code ||
        ""
      )
        .toUpperCase() ===
      String(
        code
      )
        .toUpperCase()
  ).length;

}


/* =========================================================
   CUPÓN MÁS COPIADO
========================================================= */

function getMostCopiedCoupon() {

  const counts =
    {};


  copias.forEach(
    item => {

      const code =
        String(
          item.codigo ||
          item.code ||
          ""
        )
          .trim()
          .toUpperCase();


      if (!code) {

        return;

      }


      counts[code] =
        (
          counts[code] ||
          0
        ) + 1;

    }
  );


  let best =
    null;


  let bestCount =
    0;


  Object.entries(
    counts
  )
    .forEach(
      (
        [
          code,
          count
        ]
      ) => {

        if (
          count >
          bestCount
        ) {

          best =
            code;

          bestCount =
            count;

        }

      }
    );


  return {

    code:
      best,

    count:
      bestCount

  };

}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

function renderStatistics() {

  const mostCopied =
    getMostCopiedCoupon();


  setText(
    [
      "mostCopiedCoupon",
      "topCoupon",
      "statTopCoupon"
    ],
    mostCopied.code ||
    "Ninguno"
  );


  setText(
    [
      "mostCopiedCount",
      "topCouponCopies",
      "statTopCouponCopies"
    ],
    mostCopied.count
  );


  const stats =
    getCouponStats();


  const container =
    $(
      "couponStats"
    ) ||
    $(
      "couponStatistics"
    );


  if (
    container
  ) {

    container.innerHTML =
      stats
        .map(
          item => `

            <div class="coupon-stat-row">

              <div>

                <strong>
                  ${escapeHtml(
                    item.code
                  )}
                </strong>

                <small>
                  ${
                    escapeHtml(
                      item.title
                    )
                  }
                </small>

              </div>

              <div class="coupon-stat-number">

                ${item.count}

                <small>
                  copias
                </small>

              </div>

            </div>

          `
        )
        .join("");

  }

}


/* =========================================================
   ESTADÍSTICAS CUPONES
========================================================= */

function getCouponStats() {

  const map =
    {};


  copias.forEach(
    item => {

      const code =
        String(
          item.codigo ||
          item.code ||
          ""
        )
          .trim()
          .toUpperCase();


      if (!code) {

        return;

      }


      if (
        !map[code]
      ) {

        map[code] = {

          code,

          count:
            0,

          title:
            ""

        };

      }


      map[code].count++;

    }
  );


  cupones.forEach(
    coupon => {

      const code =
        String(
          coupon.codigo ||
          coupon.code ||
          ""
        )
          .trim()
          .toUpperCase();


      if (
        map[code]
      ) {

        map[code].title =
          coupon.titulo ||
          coupon.nombre ||
          "";

      }

    }
  );


  return Object.values(
    map
  )
    .sort(
      (
        a,
        b
      ) =>
        b.count -
        a.count
    );

}


/* =========================================================
   CLICS POR DÍA
========================================================= */

function getClicksByDay() {

  const map =
    {};


  copias.forEach(
    item => {

      const key =
        dateKey(
          item.fecha ||
          item.createdAt ||
          item.timestamp
        );


      if (!key) {

        return;

      }


      map[key] =
        (
          map[key] ||
          0
        ) + 1;

    }
  );


  return Object.entries(
    map
  )
    .sort(
      (
        a,
        b
      ) =>
        a[0].localeCompare(
          b[0]
        )
    );

}


/* =========================================================
   USUARIOS POR ESTADO
========================================================= */

function getUsersByState() {

  const map =
    {};


  usuarios.forEach(
    user => {

      const estado =
        String(
          user.estado ||
          "No especificado"
        )
          .trim();


      map[estado] =
        (
          map[estado] ||
          0
        ) + 1;

    }
  );


  return Object.entries(
    map
  )
    .sort(
      (
        a,
        b
      ) =>
        b[1] -
        a[1]
    );

}


/* =========================================================
   GRÁFICAS
========================================================= */

function renderCharts() {

  renderClicksChart();

  renderStateChart();

}


/* =========================================================
   GRÁFICA CLICKS
========================================================= */

function renderClicksChart() {

  const canvas =
    $(
      "clicksChart"
    ) ||
    $(
      "clicksPerDayChart"
    );


  if (!canvas) {

    return;

  }


  const ctx =
    canvas.getContext(
      "2d"
    );


  const data =
    getClicksByDay();


  const labels =
    data.map(
      item =>
        item[0]
    );


  const values =
    data.map(
      item =>
        item[1]
    );


  if (
    window.clicksChartInstance
  ) {

    window.clicksChartInstance.destroy();

  }


  if (
    typeof Chart !==
    "undefined"
  ) {

    window.clicksChartInstance =
      new Chart(
        ctx,
        {

          type:
            "line",

          data: {

            labels,

            datasets: [

              {

                label:
                  "Clics por día",

                data:
                  values,

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
                  true

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

  } else {

    renderSimpleChart(
      canvas,
      labels,
      values,
      "Clics"
    );

  }

}


/* =========================================================
   GRÁFICA ESTADOS
========================================================= */

function renderStateChart() {

  const canvas =
    $(
      "statesChart"
    ) ||
    $(
      "usersStateChart"
    );


  if (!canvas) {

    return;

  }


  const data =
    getUsersByState();


  const labels =
    data.map(
      item =>
        item[0]
    );


  const values =
    data.map(
      item =>
        item[1]
    );


  const ctx =
    canvas.getContext(
      "2d"
    );


  if (
    window.statesChartInstance
  ) {

    window.statesChartInstance.destroy();

  }


  if (
    typeof Chart !==
    "undefined"
  ) {

    window.statesChartInstance =
      new Chart(
        ctx,
        {

          type:
            "bar",

          data: {

            labels,

            datasets: [

              {

                label:
                  "Usuarios",

                data:
                  values

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

  } else {

    renderSimpleChart(
      canvas,
      labels,
      values,
      "Usuarios"
    );

  }

}


/* =========================================================
   GRÁFICA DE RESPALDO
========================================================= */

function renderSimpleChart(
  canvas,
  labels,
  values,
  title
) {

  const ctx =
    canvas.getContext(
      "2d"
    );


  const width =
    canvas.width =
      canvas.clientWidth ||
      700;


  const height =
    canvas.height =
      300;


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  if (!values.length) {

    ctx.font =
      "16px Arial";

    ctx.fillText(
      "Sin datos todavía",
      20,
      40
    );

    return;

  }


  const max =
    Math.max(
      ...values,
      1
    );


  const padding =
    40;


  const chartWidth =
    width -
    padding * 2;


  const chartHeight =
    height -
    padding * 2;


  const step =
    chartWidth /
    Math.max(
      values.length - 1,
      1
    );


  ctx.beginPath();


  values.forEach(
    (
      value,
      index
    ) => {

      const x =
        padding +
        index *
        step;


      const y =
        height -
        padding -
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


  ctx.font =
    "11px Arial";


  labels.forEach(
    (
      label,
      index
    ) => {

      const x =
        padding +
        index *
        step;


      ctx.fillText(
        label,
        x - 20,
        height - 10
      );

    }
  );


  ctx.font =
    "14px Arial";


  ctx.fillText(
    title,
    10,
    20
  );

}


/* =========================================================
   AGREGAR OFERTA
========================================================= */

async function saveOffer() {

  const title =
    value(
      [
        "offerTitle",
        "tituloOferta"
      ]
    );


  const category =
    value(
      [
        "offerCategory",
        "categoriaOferta"
      ]
    );


  const before =
    numericValue(
      [
        "offerOldPrice",
        "offerPriceBefore",
        "precioAntes"
      ]
    );


  const current =
    numericValue(
      [
        "offerPrice",
        "offerCurrentPrice",
        "precioActual"
      ]
    );


  const link =
    value(
      [
        "offerLink",
        "linkOferta"
      ]
    );


  const image =
    value(
      [
        "offerImageBase64",
        "imagenOferta"
      ]
    );


  if (!title) {

    showToast(
      "❌ Escribe el título",
      "error"
    );

    return;

  }


  if (!current) {

    showToast(
      "❌ Escribe el precio",
      "error"
    );

    return;

  }


  const data = {

    titulo:
      title,

    categoria:
      category,

    precioAntes:
      before,

    precioActual:
      current,

    link:
      link ||
      "https://www.mercadolibre.com.mx/",

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

      await addDoc(
        collection(
          db,
          "ofertas"
        ),
        {

          ...data,

          creado:
            serverTimestamp()

        }
      );


      showToast(
        "✅ Oferta publicada"
      );

    }


    currentOfferId =
      null;


    clearOfferForm();

    await loadAllData();

  } catch (
    error
  ) {

    console.error(
      error
    );


    showToast(
      "❌ No se pudo guardar la oferta",
      "error"
    );

  }

}


/* =========================================================
   AGREGAR CUPÓN
========================================================= */

async function saveCoupon() {

  const codigo =
    value(
      [
        "couponCode",
        "codigoCupon",
        "couponCodigo"
      ]
    )
      .toUpperCase();


  const titulo =
    value(
      [
        "couponTitle",
        "tituloCupon"
      ]
    );


  const descuento =
    value(
      [
        "couponDiscount",
        "descuentoCupon"
      ]
    );


  const minimo =
    numericValue(
      [
        "couponMinimum",
        "couponMin",
        "compraMinima"
      ]
    );


  const tope =
    numericValue(
      [
        "couponMaximum",
        "couponTop",
        "topeCupon"
      ]
    );


  const link =
    value(
      [
        "couponLink",
        "linkCupon"
      ]
    );


  const tipo =
    value(
      [
        "couponType",
        "tipoCupon"
      ]
    ) ||
    "flash";


  const estado =
    value(
      [
        "couponStatus",
        "estadoCupon"
      ]
    ) ||
    "activo";


  const categoria =
    value(
      [
        "couponCategory",
        "categoriaCupon"
      ]
    );


  if (!codigo) {

    showToast(
      "❌ Escribe el código del cupón",
      "error"
    );

    return;

  }


  const data = {

    codigo,

    titulo:
      titulo ||
      "Cupón disponible",

    descuento,

    compraMinima:
      minimo,

    tope,

    link:
      link ||
      "https://www.mercadolibre.com.mx/",

    tipo,

    estado,

    categoria,

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

      await addDoc(
        collection(
          db,
          "cupones"
        ),
        {

          ...data,

          creado:
            serverTimestamp()

        }
      );


      showToast(
        "🎟️ Cupón publicado"
      );

    }


    currentCouponId =
      null;


    clearCouponForm();

    await loadAllData();

  } catch (
    error
  ) {

    console.error(
      error
    );


    showToast(
      "❌ Error guardando cupón",
      "error"
    );

  }

}


/* =========================================================
   VALOR INPUT
========================================================= */

function value(
  ids
) {

  for (
    const id of ids
  ) {

    const element =
      $(id);


    if (
      element
    ) {

      return element.value.trim();

    }

  }


  return "";

}


/* =========================================================
   VALOR NUMÉRICO
========================================================= */

function numericValue(
  ids
) {

  const raw =
    value(
      ids
    );


  if (!raw) {

    return 0;

  }


  const number =
    Number(
      raw.replace(
        /[$,\s]/g,
        ""
      )
    );


  return Number.isNaN(
    number
  )
    ? 0
    : number;

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

    return;

  }


  currentOfferId =
    id;


  setValue(
    [
      "offerTitle",
      "tituloOferta"
    ],
    offer.titulo
  );


  setValue(
    [
      "offerCategory",
      "categoriaOferta"
    ],
    offer.categoria
  );


  setValue(
    [
      "offerOldPrice",
      "offerPriceBefore",
      "precioAntes"
    ],
    offer.precioAntes
  );


  setValue(
    [
      "offerPrice",
      "offerCurrentPrice",
      "precioActual"
    ],
    offer.precioActual
  );


  setValue(
    [
      "offerLink",
      "linkOferta"
    ],
    offer.link
  );


  setValue(
    [
      "offerImageBase64",
      "imagenOferta"
    ],
    offer.imagenBase64 ||
    offer.imagen ||
    ""
  );


  showToast(
    "✏️ Oferta cargada para editar"
  );


  scrollToForm(
    [
      "offerTitle",
      "tituloOferta"
    ]
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

    return;

  }


  currentCouponId =
    id;


  setValue(
    [
      "couponCode",
      "codigoCupon",
      "couponCodigo"
    ],
    coupon.codigo ||
    coupon.code ||
    ""
  );


  setValue(
    [
      "couponTitle",
      "tituloCupon"
    ],
    coupon.titulo ||
    coupon.nombre ||
    ""
  );


  setValue(
    [
      "couponDiscount",
      "descuentoCupon"
    ],
    coupon.descuento ||
    ""
  );


  setValue(
    [
      "couponMinimum",
      "couponMin",
      "compraMinima"
    ],
    coupon.compraMinima ||
    coupon.minimo ||
    0
  );


  setValue(
    [
      "couponMaximum",
      "couponTop",
      "topeCupon"
    ],
    coupon.tope ||
    coupon.topeMaximo ||
    0
  );


  setValue(
    [
      "couponLink",
      "linkCupon"
    ],
    coupon.link ||
    ""
  );


  setValue(
    [
      "couponType",
      "tipoCupon"
    ],
    coupon.tipo ||
    "flash"
  );


  setValue(
    [
      "couponStatus",
      "estadoCupon"
    ],
    coupon.estado ||
    "activo"
  );


  setValue(
    [
      "couponCategory",
      "categoriaCupon"
    ],
    coupon.categoria ||
    ""
  );


  showToast(
    "✏️ Cupón cargado para editar"
  );


  scrollToForm(
    [
      "couponCode",
      "codigoCupon"
    ]
  );

}


/* =========================================================
   SET VALUE
========================================================= */

function setValue(
  ids,
  value
) {

  for (
    const id of ids
  ) {

    const element =
      $(id);


    if (element) {

      element.value =
        value ??
        "";

      return;

    }

  }

}


/* =========================================================
   SCROLL FORM
========================================================= */

function scrollToForm(
  ids
) {

  for (
    const id of ids
  ) {

    const element =
      $(id);


    if (element) {

      element.scrollIntoView({
        behavior:
          "smooth",
        block:
          "center"
      });

      element.focus();

      return;

    }

  }

}


/* =========================================================
   BORRAR OFERTA
========================================================= */

async function deleteOffer(
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


    showToast(
      "🗑️ Oferta eliminada"
    );


    await loadAllData();

  } catch (
    error
  ) {

    console.error(
      error
    );


    showToast(
      "❌ No se pudo eliminar",
      "error"
    );

  }

}


/* =========================================================
   BORRAR CUPÓN
========================================================= */

async function deleteCoupon(
  id
) {

  if (
    !confirm(
      "¿Eliminar este cupón?"
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


    showToast(
      "🗑️ Cupón eliminado"
    );


    await loadAllData();

  } catch (
    error
  ) {

    console.error(
      error
    );


    showToast(
      "❌ No se pudo eliminar",
      "error"
    );

  }

}


/* =========================================================
   BORRAR USUARIO
========================================================= */

async function deleteUser(
  id
) {

  if (
    !confirm(
      "¿Eliminar este usuario?"
    )
  ) {

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


    await loadAllData();

  } catch (
    error
  ) {

    console.error(
      error
    );


    showToast(
      "❌ No se pudo eliminar",
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

    return;

  }


  currentUserId =
    id;


  setValue(
    [
      "userName",
      "usuarioNombre"
    ],
    user.nombre
  );


  setValue(
    [
      "userEmail",
      "usuarioEmail"
    ],
    user.email
  );


  setValue(
    [
      "userPhone",
      "usuarioTelefono"
    ],
    user.telefono
  );


  setValue(
    [
      "userState",
      "usuarioEstado",
      "estadoUsuario"
    ],
    user.estado
  );


  setValue(
    [
      "userSavings",
      "ahorroUsuario"
    ],
    user.ahorroTotal ||
    0
  );


  setValue(
    [
      "userPurchases",
      "comprasUsuario"
    ],
    user.compras ||
    0
  );


  setValue(
    [
      "userCoupons",
      "cuponesUsuario"
    ],
    user.cuponesUsados ||
    0
  );


  showToast(
    "✏️ Usuario cargado para editar"
  );


  scrollToForm(
    [
      "userName",
      "usuarioNombre"
    ]
  );

}


/* =========================================================
   GUARDAR USUARIO
========================================================= */

async function saveUser() {

  if (!currentUserId) {

    showToast(
      "Selecciona un usuario primero",
      "error"
    );

    return;

  }


  const user =
    usuarios.find(
      item =>
        item.id ===
        currentUserId
    );


  if (!user) {

    return;

  }


  const data = {

    nombre:
      value(
        [
          "userName",
          "usuarioNombre"
        ]
      ) ||
      user.nombre ||
      "",

    email:
      value(
        [
          "userEmail",
          "usuarioEmail"
        ]
      ) ||
      user.email ||
      "",

    telefono:
      value(
        [
          "userPhone",
          "usuarioTelefono"
        ]
      ) ||
      user.telefono ||
      "",

    estado:
      value(
        [
          "userState",
          "usuarioEstado",
          "estadoUsuario"
        ]
      ) ||
      user.estado ||
      "",

    ahorroTotal:
      numericValue(
        [
          "userSavings",
          "ahorroUsuario"
        ]
      ),

    compras:
      numericValue(
        [
          "userPurchases",
          "comprasUsuario"
        ]
      ),

    cuponesUsados:
      numericValue(
        [
          "userCoupons",
          "cuponesUsuario"
        ]
      )

  };


  try {

    await updateDoc(
      doc(
        db,
        "usuarios",
        currentUserId
      ),
      data
    );


    showToast(
      "✅ Usuario actualizado"
    );


    currentUserId =
      null;


    await loadAllData();

  } catch (
    error
  ) {

    console.error(
      error
    );


    showToast(
      "❌ Error actualizando usuario",
      "error"
    );

  }

}


/* =========================================================
   LIMPIAR FORM OFERTA
========================================================= */

function clearOfferForm() {

  currentOfferId =
    null;


  [
    "offerTitle",
    "tituloOferta",
    "offerCategory",
    "categoriaOferta",
    "offerOldPrice",
    "offerPriceBefore",
    "precioAntes",
    "offerPrice",
    "offerCurrentPrice",
    "precioActual",
    "offerLink",
    "linkOferta",
    "offerImageBase64",
    "imagenOferta"
  ]
    .forEach(
      id => {

        const element =
          $(id);


        if (element) {

          element.value =
            "";

        }

      }
    );

}


/* =========================================================
   LIMPIAR FORM CUPÓN
========================================================= */

function clearCouponForm() {

  currentCouponId =
    null;


  [
    "couponCode",
    "codigoCupon",
    "couponCodigo",
    "couponTitle",
    "tituloCupon",
    "couponDiscount",
    "descuentoCupon",
    "couponMinimum",
    "couponMin",
    "compraMinima",
    "couponMaximum",
    "couponTop",
    "topeCupon",
    "couponLink",
    "linkCupon",
    "couponCategory",
    "categoriaCupon"
  ]
    .forEach(
      id => {

        const element =
          $(id);


        if (element) {

          element.value =
            "";

        }

      }
    );

}


/* =========================================================
   EVENTOS ADMIN
========================================================= */

document.addEventListener(
  "click",
  event => {

    const editOfferButton =
      event.target.closest(
        "[data-edit-offer]"
      );


    if (
      editOfferButton
    ) {

      editOffer(
        editOfferButton.dataset.editOffer
      );

      return;

    }


    const deleteOfferButton =
      event.target.closest(
        "[data-delete-offer]"
      );


    if (
      deleteOfferButton
    ) {

      deleteOffer(
        deleteOfferButton.dataset.deleteOffer
      );

      return;

    }


    const editCouponButton =
      event.target.closest(
        "[data-edit-coupon]"
      );


    if (
      editCouponButton
    ) {

      editCoupon(
        editCouponButton.dataset.editCoupon
      );

      return;

    }


    const deleteCouponButton =
      event.target.closest(
        "[data-delete-coupon]"
      );


    if (
      deleteCouponButton
    ) {

      deleteCoupon(
        deleteCouponButton.dataset.deleteCoupon
      );

      return;

    }


    const editUserButton =
      event.target.closest(
        "[data-edit-user]"
      );


    if (
      editUserButton
    ) {

      editUser(
        editUserButton.dataset.editUser
      );

      return;

    }


    const deleteUserButton =
      event.target.closest(
        "[data-delete-user]"
      );


    if (
      deleteUserButton
    ) {

      deleteUser(
        deleteUserButton.dataset.deleteUser
      );

      return;

    }

  }
);


/* =========================================================
   BOTONES
========================================================= */

function connectButton(
  ids,
  callback
) {

  ids.forEach(
    id => {

      const button =
        $(id);


      if (
        button
      ) {

        button.addEventListener(
          "click",
          event => {

            event.preventDefault();

            callback();

          }
        );

      }

    }
  );

}


connectButton(
  [
    "saveOffer",
    "saveOfferButton",
    "addOfferButton",
    "publishOfferButton"
  ],
  saveOffer
);


connectButton(
  [
    "saveCoupon",
    "saveCouponButton",
    "addCouponButton",
    "publishCouponButton"
  ],
  saveCoupon
);


connectButton(
  [
    "saveUser",
    "saveUserButton",
    "updateUserButton"
  ],
  saveUser
);


connectButton(
  [
    "clearOffer",
    "clearOfferButton",
    "cancelOffer"
  ],
  clearOfferForm
);


connectButton(
  [
    "clearCoupon",
    "clearCouponButton",
    "cancelCoupon"
  ],
  clearCouponForm
);


/* =========================================================
   ACTUALIZAR
========================================================= */

connectButton(
  [
    "refreshButton",
    "refreshData",
    "reloadButton"
  ],
  loadAllData
);


/* =========================================================
   BUSCAR
========================================================= */

function setupSearch(
  inputIds,
  callback
) {

  inputIds.forEach(
    id => {

      const input =
        $(id);


      if (!input) {

        return;

      }


      input.addEventListener(
        "input",
        () => {

          callback(
            input.value
              .trim()
              .toLowerCase()
          );

        }
      );

    }
  );

}


setupSearch(
  [
    "offerSearch",
    "searchOffers"
  ],
  searchOffers
);


setupSearch(
  [
    "couponSearch",
    "searchCoupons"
  ],
  searchCoupons
);


setupSearch(
  [
    "userSearch",
    "searchUsers"
  ],
  searchUsers
);


/* =========================================================
   BUSCAR OFERTAS
========================================================= */

function searchOffers(
  text
) {

  document
    .querySelectorAll(
      ".admin-offer-card"
    )
    .forEach(
      card => {

        card.style.display =
          (
            !text ||
            card.innerText
              .toLowerCase()
              .includes(
                text
              )
          )
            ? ""
            : "none";

      }
    );

}


/* =========================================================
   BUSCAR CUPONES
========================================================= */

function searchCoupons(
  text
) {

  document
    .querySelectorAll(
      ".admin-coupon-card"
    )
    .forEach(
      card => {

        card.style.display =
          (
            !text ||
            card.innerText
              .toLowerCase()
              .includes(
                text
              )
          )
            ? ""
            : "none";

      }
    );

}


/* =========================================================
   BUSCAR USUARIOS
========================================================= */

function searchUsers(
  text
) {

  document
    .querySelectorAll(
      ".admin-user-card"
    )
    .forEach(
      card => {

        card.style.display =
          (
            !text ||
            card.innerText
              .toLowerCase()
              .includes(
                text
              )
          )
            ? ""
            : "none";

      }
    );

}


/* =========================================================
   IMAGEN BASE64
========================================================= */

function setupImageInput() {

  const inputs = [

    "offerImage",

    "offerImageFile",

    "imagenOfertaFile"

  ];


  inputs.forEach(
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
            900 *
            1024
          ) {

            showToast(
              "❌ Imagen demasiado grande. Máximo 900 KB.",
              "error"
            );

            input.value =
              "";

            return;

          }


          const reader =
            new FileReader();


          reader.onload =
            () => {

              setValue(
                [
                  "offerImageBase64",
                  "imagenOferta"
                ],
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
   ESTADÍSTICAS DETALLADAS
========================================================= */

function renderDetailedStats() {

  const mostCopied =
    getMostCopiedCoupon();


  const clicks =
    getClicksByDay();


  const states =
    getUsersByState();


  const statsData = {

    totalClicks:
      copias.length,

    mostCopiedCoupon:
      mostCopied.code ||
      null,

    mostCopiedCount:
      mostCopied.count,

    clicksByDay:
      clicks,

    usersByState:
      states,

    totalUsers:
      usuarios.length,

    totalOffers:
      ofertas.length,

    totalCoupons:
      cupones.length,

    updatedAt:
      new Date()

  };


  const container =
    $(
      "detailedStatistics"
    );


  if (
    container
  ) {

    container.innerHTML = `

      <div class="stats-summary">

        <div>
          <strong>
            ${statsData.totalClicks}
          </strong>
          <span>
            Clics
          </span>
        </div>

        <div>
          <strong>
            ${escapeHtml(
              statsData.mostCopiedCoupon ||
              "—"
            )}
          </strong>
          <span>
            Cupón más copiado
          </span>
        </div>

        <div>
          <strong>
            ${statsData.mostCopiedCount}
          </strong>
          <span>
            Copias
          </span>
        </div>

      </div>

    `;

  }

}


/* =========================================================
   GUARDAR ESTADÍSTICAS RESUMEN
========================================================= */

async function saveStatisticsSummary() {

  try {

    const mostCopied =
      getMostCopiedCoupon();


    await setDoc(
      doc(
        db,
        "estadisticas",
        "general"
      ),
      {

        totalClics:
          copias.length,

        cuponMasCopiado:
          mostCopied.code ||
          "",

        copiasCuponMasCopiado:
          mostCopied.count,

        totalUsuarios:
          usuarios.length,

        totalOfertas:
          ofertas.length,

        totalCupones:
          cupones.length,

        actualizado:
          serverTimestamp()

      },
      {
        merge:
          true
      }
    );

  } catch (
    error
  ) {

    console.error(
      "Estadísticas:",
      error
    );

  }

}


/* =========================================================
   PREPARAR ESTADÍSTICAS
========================================================= */

async function updateStatistics() {

  renderDetailedStats();

  await saveStatisticsSummary();

}


/* =========================================================
   INICIALIZAR
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupImageInput();

    await loadAllData();

    await updateStatistics();

  }
);


/* =========================================================
   ACTUALIZAR ESTADÍSTICAS DESPUÉS
========================================================= */

const originalRender =
  renderEverything;


renderEverything =
  function() {

    originalRender();

    renderDetailedStats();

  };


/* =========================================================
   AUTO ACTUALIZACIÓN
========================================================= */

setInterval(
  async () => {

    try {

      await loadAllData();

    } catch (
      error
    ) {

      console.log(
        "Actualización automática:",
        error
      );

    }

  },
  60000
);


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

  updateStatistics,

  clearOfferForm,

  clearCouponForm

};


/* =========================================================
   FIN ADMIN PRO
========================================================= */