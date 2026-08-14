/* =========================================================
   ⚡ EL PATRÓN DE LAS OFERTAS
   ADMIN PRO — admin.js

   FUNCIONES:
   ✓ Cupones
   ✓ Ofertas
   ✓ Usuarios
   ✓ Estadísticas
   ✓ Cupón más copiado
   ✓ Copias por cupón
   ✓ Solo 1 copia por cupón / usuario / día
   ✓ Estado de México del usuario
   ✓ Gráfica de clics por día
   ✓ Ahorro total
   ✓ Compras
   ✓ Cupones utilizados
   ✓ Ranking
   ✓ Firebase Firestore
   ✓ Imágenes Base64
   ✓ Sin Firebase Storage
========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp
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


const app =
  initializeApp(firebaseConfig);

const db =
  getFirestore(app);


/* =========================================================
   VARIABLES GLOBALES
========================================================= */

let cupones = [];
let ofertas = [];
let usuarios = [];
let copias = [];
let visitas = [];

let graficaClicks = null;
let graficaCupones = null;
let graficaEstados = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    iniciarAdmin();

  }
);


/* =========================================================
   INICIAR ADMIN
========================================================= */

async function iniciarAdmin() {

  console.log(
    "⚡ Iniciando Admin PRO..."
  );

  configurarMenu();

  configurarEventos();

  await cargarTodo();

}


/* =========================================================
   CARGAR TODO
========================================================= */

async function cargarTodo() {

  mostrarCarga(true);

  try {

    await Promise.all([
      cargarCupones(),
      cargarOfertas(),
      cargarUsuarios(),
      cargarCopias(),
      cargarVisitas()
    ]);

    actualizarDashboard();

    actualizarTablas();

    generarEstadisticas();

  } catch (error) {

    console.error(
      "Error cargando Admin:",
      error
    );

    mostrarToast(
      "❌ Error cargando información"
    );

  } finally {

    mostrarCarga(false);

  }

}


/* =========================================================
   CARGAR CUPONES
========================================================= */

async function cargarCupones() {

  cupones = [];

  const snapshot =
    await getDocs(
      collection(
        db,
        "cupones"
      )
    );

  snapshot.forEach(
    item => {

      cupones.push({

        id:
          item.id,

        ...item.data()

      });

    }
  );

  console.log(
    `🎟️ ${cupones.length} cupones cargados`
  );

}


/* =========================================================
   CARGAR OFERTAS
========================================================= */

async function cargarOfertas() {

  ofertas = [];

  const snapshot =
    await getDocs(
      collection(
        db,
        "ofertas"
      )
    );

  snapshot.forEach(
    item => {

      ofertas.push({

        id:
          item.id,

        ...item.data()

      });

    }
  );

  console.log(
    `🔥 ${ofertas.length} ofertas cargadas`
  );

}


/* =========================================================
   CARGAR USUARIOS
========================================================= */

async function cargarUsuarios() {

  usuarios = [];

  const snapshot =
    await getDocs(
      collection(
        db,
        "usuarios"
      )
    );

  snapshot.forEach(
    item => {

      usuarios.push({

        id:
          item.id,

        ...item.data()

      });

    }
  );

  console.log(
    `👥 ${usuarios.length} usuarios cargados`
  );

}


/* =========================================================
   CARGAR COPIAS
========================================================= */

async function cargarCopias() {

  copias = [];

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "copias"
        )
      );

    snapshot.forEach(
      item => {

        copias.push({

          id:
            item.id,

          ...item.data()

        });

      }
    );

  } catch (error) {

    console.error(
      "Error copias:",
      error
    );

  }

  console.log(
    `📋 ${copias.length} copias cargadas`
  );

}


/* =========================================================
   CARGAR VISITAS / CLICS
========================================================= */

async function cargarVisitas() {

  visitas = [];

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "visitas"
        )
      );

    snapshot.forEach(
      item => {

        visitas.push({

          id:
            item.id,

          ...item.data()

        });

      }
    );

  } catch (error) {

    console.log(
      "Colección visitas no disponible:",
      error
    );

  }

}


/* =========================================================
   DASHBOARD
========================================================= */

function actualizarDashboard() {

  ponerNumero(
    [
      "totalOfertas",
      "ofertasTotal",
      "statOfertas"
    ],
    ofertas.length
  );


  ponerNumero(
    [
      "totalCupones",
      "cuponesTotal",
      "statCupones"
    ],
    cupones.length
  );


  ponerNumero(
    [
      "totalUsuarios",
      "usuariosTotal",
      "statUsuarios"
    ],
    usuarios.length
  );


  ponerNumero(
    [
      "totalCopias",
      "copiasTotal",
      "statCopias"
    ],
    copias.length
  );


  const clicks =
    calcularClicksUnicos();


  ponerNumero(
    [
      "totalClicks",
      "clicksTotal",
      "statClicks"
    ],
    clicks
  );


  const ahorro =
    usuarios.reduce(
      (
        total,
        usuario
      ) => {

        return (
          total +
          Number(
            usuario.ahorroTotal ||
            0
          )
        );

      },
      0
    );


  ponerTexto(
    [
      "ahorroTotal",
      "statAhorro",
      "totalAhorro"
    ],
    formatoMoneda(ahorro)
  );


  const compras =
    usuarios.reduce(
      (
        total,
        usuario
      ) => {

        return (
          total +
          Number(
            usuario.compras ||
            0
          )
        );

      },
      0
    );


  ponerNumero(
    [
      "totalCompras",
      "comprasTotal",
      "statCompras"
    ],
    compras
  );

}


/* =========================================================
   PONER NÚMERO
========================================================= */

function ponerNumero(
  ids,
  value
) {

  ids.forEach(
    id => {

      const element =
        document.getElementById(
          id
        );

      if (element) {

        element.textContent =
          Number(
            value || 0
          ).toLocaleString(
            "es-MX"
          );

      }

    }
  );

}


/* =========================================================
   PONER TEXTO
========================================================= */

function ponerTexto(
  ids,
  value
) {

  ids.forEach(
    id => {

      const element =
        document.getElementById(
          id
        );

      if (element) {

        element.textContent =
          value;

      }

    }
  );

}


/* =========================================================
   MONEDA
========================================================= */

function formatoMoneda(
  value
) {

  return Number(
    value || 0
  ).toLocaleString(
    "es-MX",
    {
      style:
        "currency",
      currency:
        "MXN"
    }
  );

}


/* =========================================================
   CLICS ÚNICOS
========================================================= */

function calcularClicksUnicos() {

  const registros =
    new Set();


  copias.forEach(
    copia => {

      const codigo =
        String(
          copia.codigo ||
          copia.cupon ||
          ""
        )
          .trim()
          .toUpperCase();


      const usuario =
        String(
          copia.usuarioId ||
          copia.userId ||
          copia.usuario ||
          copia.deviceId ||
          copia.ip ||
          "anonimo"
        );


      const fecha =
        obtenerFechaDia(
          copia.fecha ||
          copia.createdAt ||
          copia.timestamp
        );


      registros.add(
        `${codigo}|${usuario}|${fecha}`
      );

    }
  );


  return registros.size;

}


/* =========================================================
   FECHA
========================================================= */

function obtenerFechaDia(
  fecha
) {

  if (!fecha) {

    return "sin-fecha";

  }


  try {

    let date;


    if (
      fecha instanceof Timestamp
    ) {

      date =
        fecha.toDate();

    } else if (
      fecha &&
      typeof fecha.toDate ===
        "function"
    ) {

      date =
        fecha.toDate();

    } else if (
      fecha instanceof Date
    ) {

      date =
        fecha;

    } else {

      date =
        new Date(fecha);

    }


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "sin-fecha";

    }


    return [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      ),
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      )
    ].join("-");


  } catch {

    return "sin-fecha";

  }

}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

function generarEstadisticas() {

  generarCuponMasCopiado();

  generarCopiasPorCupon();

  generarClicksPorDia();

  generarUsuariosPorEstado();

  generarRankingUsuarios();

}


/* =========================================================
   CUPÓN MÁS COPIADO
========================================================= */

function generarCuponMasCopiado() {

  const contador = {};


  copias.forEach(
    copia => {

      const codigo =
        String(
          copia.codigo ||
          copia.cupon ||
          "SIN CUPÓN"
        )
          .trim()
          .toUpperCase();


      if (!contador[codigo]) {

        contador[codigo] =
          0;

      }


      contador[codigo]++;

    }
  );


  const ordenados =
    Object.entries(
      contador
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
      );


  const ganador =
    ordenados[0];


  if (!ganador) {

    ponerTexto(
      [
        "topCoupon",
        "cuponMasCopiado",
        "mostCopiedCoupon"
      ],
      "Sin datos"
    );

    return;

  }


  ponerTexto(
    [
      "topCoupon",
      "cuponMasCopiado",
      "mostCopiedCoupon"
    ],
    ganador[0]
  );


  ponerNumero(
    [
      "topCouponCopies",
      "copiasTopCoupon",
      "mostCopiedCount"
    ],
    ganador[1]
  );

}


/* =========================================================
   COPIAS POR CUPÓN
========================================================= */

function generarCopiasPorCupon() {

  const container =
    buscarElemento(
      [
        "couponStats",
        "copiasPorCupon",
        "couponStatistics",
        "couponStatsList"
      ]
    );


  if (!container) {

    return;

  }


  const contador = {};


  copias.forEach(
    copia => {

      const codigo =
        String(
          copia.codigo ||
          copia.cupon ||
          "SIN CUPÓN"
        )
          .trim()
          .toUpperCase();


      contador[codigo] =
        (
          contador[codigo] ||
          0
        ) + 1;

    }
  );


  const ordenados =
    Object.entries(
      contador
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
      );


  container.innerHTML =
    "";


  if (!ordenados.length) {

    container.innerHTML =
      `
        <div class="empty-state">
          No hay copias registradas todavía.
        </div>
      `;

    return;

  }


  ordenados.forEach(
    (
      item,
      index
    ) => {

      const codigo =
        item[0];

      const cantidad =
        item[1];


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "coupon-stat-row";


      card.innerHTML = `

        <div class="coupon-stat-position">
          #${index + 1}
        </div>

        <div class="coupon-stat-info">

          <strong>
            ${escapeHtml(codigo)}
          </strong>

          <span>
            ${cantidad}
            ${cantidad === 1
              ? " copia"
              : " copias"}
          </span>

        </div>

        <div class="coupon-stat-bar">

          <span
            style="
              width:${calcularPorcentaje(
                cantidad,
                ordenados[0][1]
              )}%
            "
          ></span>

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   PORCENTAJE
========================================================= */

function calcularPorcentaje(
  value,
  max
) {

  if (
    !max ||
    max <= 0
  ) {

    return 0;

  }


  return Math.min(
    100,
    (
      Number(value) /
      Number(max)
    ) *
    100
  );

}


/* =========================================================
   CLICS POR DÍA
========================================================= */

function generarClicksPorDia() {

  const contador = {};


  copias.forEach(
    copia => {

      const fecha =
        obtenerFechaDia(
          copia.fecha ||
          copia.createdAt ||
          copia.timestamp
        );


      if (
        fecha ===
        "sin-fecha"
      ) {

        return;

      }


      contador[fecha] =
        (
          contador[fecha] ||
          0
        ) + 1;

    }
  );


  visitas.forEach(
    visita => {

      const fecha =
        obtenerFechaDia(
          visita.fecha ||
          visita.createdAt ||
          visita.timestamp
        );


      if (
        fecha ===
        "sin-fecha"
      ) {

        return;

      }


      contador[fecha] =
        (
          contador[fecha] ||
          0
        ) + 1;

    }
  );


  const fechas =
    Object.keys(
      contador
    )
      .sort();


  const valores =
    fechas.map(
      fecha =>
        contador[fecha]
    );


  dibujarGraficaClicks(
    fechas,
    valores
  );


  const container =
    buscarElemento(
      [
        "clicksPorDia",
        "dailyClicks",
        "clicksDaily"
      ]
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  fechas
    .slice()
    .reverse()
    .forEach(
      fecha => {

        const row =
          document.createElement(
            "div"
          );


        row.className =
          "daily-click-row";


        row.innerHTML = `

          <span>
            ${formatearFecha(
              fecha
            )}
          </span>

          <strong>
            ${contador[fecha]}
          </strong>

        `;


        container.appendChild(
          row
        );

      }
    );

}


/* =========================================================
   GRÁFICA CLICS
========================================================= */

function dibujarGraficaClicks(
  fechas,
  valores
) {

  const canvas =
    document.getElementById(
      "clicksChart"
    );


  if (!canvas) {

    return;

  }


  if (
    typeof Chart ===
    "undefined"
  ) {

    console.warn(
      "Chart.js no está cargado."
    );

    return;

  }


  if (graficaClicks) {

    graficaClicks.destroy();

  }


  graficaClicks =
    new Chart(
      canvas,
      {

        type:
          "line",

        data: {

          labels:
            fechas.map(
              formatearFecha
            ),

          datasets: [

            {

              label:
                "Clics",

              data:
                valores,

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

}


/* =========================================================
   USUARIOS POR ESTADO
========================================================= */

function generarUsuariosPorEstado() {

  const contador = {};


  usuarios.forEach(
    usuario => {

      const estado =
        String(
          usuario.estadoMexico ||
          usuario.estado ||
          usuario.region ||
          usuario.entidad ||
          "No especificado"
        )
          .trim();


      contador[estado] =
        (
          contador[estado] ||
          0
        ) + 1;

    }
  );


  const ordenados =
    Object.entries(
      contador
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
      );


  const container =
    buscarElemento(
      [
        "usersByState",
        "usuariosPorEstado",
        "estadosUsuarios",
        "stateStats"
      ]
    );


  if (container) {

    container.innerHTML =
      "";


    ordenados.forEach(
      item => {

        const row =
          document.createElement(
            "div"
          );


        row.className =
          "state-row";


        row.innerHTML = `

          <div>

            <strong>
              ${escapeHtml(
                item[0]
              )}
            </strong>

            <span>
              ${item[1]}
              ${
                item[1] === 1
                  ? " usuario"
                  : " usuarios"
              }
            </span>

          </div>

          <div class="state-bar">

            <span
              style="
                width:${calcularPorcentaje(
                  item[1],
                  ordenados[0]?.[1] || 1
                )}%
              "
            ></span>

          </div>

        `;


        container.appendChild(
          row
        );

      }
    );

  }


  dibujarGraficaEstados(
    ordenados
  );

}


/* =========================================================
   GRÁFICA ESTADOS
========================================================= */

function dibujarGraficaEstados(
  datos
) {

  const canvas =
    document.getElementById(
      "statesChart"
    );


  if (
    !canvas ||
    typeof Chart ===
      "undefined"
  ) {

    return;

  }


  if (graficaEstados) {

    graficaEstados.destroy();

  }


  graficaEstados =
    new Chart(
      canvas,
      {

        type:
          "bar",

        data: {

          labels:
            datos.map(
              item =>
                item[0]
            ),

          datasets: [

            {

              label:
                "Usuarios",

              data:
                datos.map(
                  item =>
                    item[1]
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

}


/* =========================================================
   RANKING
========================================================= */

function generarRankingUsuarios() {

  const ranking =
    [...usuarios]
      .sort(
        (
          a,
          b
        ) => {

          return (
            Number(
              b.ahorroTotal ||
              0
            ) -
            Number(
              a.ahorroTotal ||
              0
            )
          );

        }
      );


  const container =
    buscarElemento(
      [
        "rankingUsers",
        "usuariosRanking",
        "rankingTable"
      ]
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  ranking.forEach(
    (
      usuario,
      index
    ) => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "ranking-row";


      row.innerHTML = `

        <span class="ranking-position">
          ${index + 1}
        </span>

        <div class="ranking-user">

          <strong>
            ${escapeHtml(
              usuario.nombre ||
              "Usuario"
            )}
          </strong>

          <small>
            ${escapeHtml(
              usuario.email ||
              ""
            )}
          </small>

        </div>

        <strong>
          ${formatoMoneda(
            usuario.ahorroTotal ||
            0
          )}
        </strong>

      `;


      container.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   TABLAS
========================================================= */

function actualizarTablas() {

  renderTablaCupones();

  renderTablaOfertas();

  renderTablaUsuarios();

}


/* =========================================================
   TABLA CUPONES
========================================================= */

function renderTablaCupones() {

  const tbody =
    document.getElementById(
      "couponsTableBody"
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML =
    "";


  cupones.forEach(
    cupon => {

      const codigo =
        String(
          cupon.codigo ||
          cupon.code ||
          ""
        )
          .toUpperCase();


      const cantidad =
        contarCopias(
          codigo
        );


      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          ${escapeHtml(
            cupon.titulo ||
            cupon.nombre ||
            "Cupón"
          )}
        </td>

        <td>
          <strong>
            ${escapeHtml(
              codigo
            )}
          </strong>
        </td>

        <td>
          ${escapeHtml(
            cupon.descuento ||
            ""
          )}
        </td>

        <td>
          ${escapeHtml(
            cupon.tipo ||
            "flash"
          )}
        </td>

        <td>
          ${cantidad}
        </td>

        <td>
          <span class="status-badge">
            ${escapeHtml(
              cupon.estado ||
              "activo"
            )}
          </span>
        </td>

        <td>

          <button
            type="button"
            class="admin-edit"
            data-action="edit-coupon"
            data-id="${cupon.id}"
          >
            ✏️
          </button>

          <button
            type="button"
            class="admin-delete"
            data-action="delete-coupon"
            data-id="${cupon.id}"
          >
            🗑️
          </button>

        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   CONTAR COPIAS
========================================================= */

function contarCopias(
  codigo
) {

  return copias.filter(
    copia =>
      String(
        copia.codigo ||
        copia.cupon ||
        ""
      )
        .toUpperCase() ===
      codigo
  ).length;

}


/* =========================================================
   TABLA OFERTAS
========================================================= */

function renderTablaOfertas() {

  const tbody =
    document.getElementById(
      "offersTableBody"
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML =
    "";


  ofertas.forEach(
    oferta => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          ${
            oferta.imagenBase64 ||
            oferta.imagen
              ? `
                <img
                  src="${escapeAttribute(
                    oferta.imagenBase64 ||
                    oferta.imagen
                  )}"
                  class="admin-product-image"
                  alt=""
                >
              `
              : "🔥"
          }
        </td>

        <td>
          ${escapeHtml(
            oferta.titulo ||
            "Oferta"
          )}
        </td>

        <td>
          ${formatoMoneda(
            oferta.precioActual ||
            0
          )}
        </td>

        <td>
          ${escapeHtml(
            oferta.categoria ||
            ""
          )}
        </td>

        <td>

          <button
            type="button"
            class="admin-edit"
            data-action="edit-offer"
            data-id="${oferta.id}"
          >
            ✏️
          </button>

          <button
            type="button"
            class="admin-delete"
            data-action="delete-offer"
            data-id="${oferta.id}"
          >
            🗑️
          </button>

        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   TABLA USUARIOS
========================================================= */

function renderTablaUsuarios() {

  const tbody =
    document.getElementById(
      "usersTableBody"
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML =
    "";


  usuarios.forEach(
    usuario => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>

          <strong>
            ${escapeHtml(
              usuario.nombre ||
              "Usuario"
            )}
          </strong>

        </td>

        <td>
          ${escapeHtml(
            usuario.email ||
            ""
          )}
        </td>

        <td>
          ${escapeHtml(
            usuario.estadoMexico ||
            usuario.estado ||
            "No especificado"
          )}
        </td>

        <td>
          ${formatoMoneda(
            usuario.ahorroTotal ||
            0
          )}
        </td>

        <td>
          ${Number(
            usuario.compras ||
            0
          )}
        </td>

        <td>
          ${Number(
            usuario.cuponesUsados ||
            0
          )}
        </td>

        <td>

          <button
            type="button"
            class="admin-edit"
            data-action="edit-user"
            data-id="${usuario.id}"
          >
            ✏️
          </button>

        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   EVENTOS ADMIN
========================================================= */

function configurarEventos() {

  document.addEventListener(
    "click",
    async event => {

      const element =
        event.target.closest(
          "[data-action]"
        );


      if (!element) {

        return;

      }


      const action =
        element.dataset.action;


      const id =
        element.dataset.id;


      if (
        action ===
        "delete-coupon"
      ) {

        await eliminarCupon(
          id
        );

      }


      if (
        action ===
        "delete-offer"
      ) {

        await eliminarOferta(
          id
        );

      }


      if (
        action ===
        "edit-coupon"
      ) {

        editarCupon(
          id
        );

      }


      if (
        action ===
        "edit-offer"
      ) {

        editarOferta(
          id
        );

      }


      if (
        action ===
        "edit-user"
      ) {

        editarUsuario(
          id
        );

      }

    }
  );


  configurarFormularioCupon();

  configurarFormularioOferta();

}


/* =========================================================
   FORMULARIO CUPÓN
========================================================= */

function configurarFormularioCupon() {

  const form =
    buscarElemento(
      [
        "couponForm",
        "cuponForm",
        "formCoupon"
      ]
    );


  if (!form) {

    return;

  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const data =
        obtenerDatosFormulario(
          form
        );


      try {

        await addDoc(
          collection(
            db,
            "cupones"
          ),
          {

            ...data,

            fechaCreacion:
              serverTimestamp(),

            estado:
              data.estado ||
              "activo"

          }
        );


        mostrarToast(
          "✅ Cupón agregado"
        );


        form.reset();

        await cargarTodo();

      } catch (error) {

        console.error(
          error
        );

        mostrarToast(
          "❌ No se pudo guardar el cupón"
        );

      }

    }
  );

}


/* =========================================================
   FORMULARIO OFERTA
========================================================= */

function configurarFormularioOferta() {

  const form =
    buscarElemento(
      [
        "offerForm",
        "ofertaForm",
        "formOffer"
      ]
    );


  if (!form) {

    return;

  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const data =
        obtenerDatosFormulario(
          form
        );


      try {

        await addDoc(
          collection(
            db,
            "ofertas"
          ),
          {

            ...data,

            precioAntes:
              Number(
                data.precioAntes ||
                0
              ),

            precioActual:
              Number(
                data.precioActual ||
                0
              ),

            fechaCreacion:
              serverTimestamp()

          }
        );


        mostrarToast(
          "✅ Oferta agregada"
        );


        form.reset();

        await cargarTodo();

      } catch (error) {

        console.error(
          error
        );

        mostrarToast(
          "❌ No se pudo guardar la oferta"
        );

      }

    }
  );

}


/* =========================================================
   OBTENER DATOS FORMULARIO
========================================================= */

function obtenerDatosFormulario(
  form
) {

  const data = {};


  form.querySelectorAll(
    "input, select, textarea"
  )
    .forEach(
      input => {

        if (!input.name) {

          return;

        }


        data[input.name] =
          input.type ===
            "checkbox"
            ? input.checked
            : input.value.trim();

      }
    );


  return data;

}


/* =========================================================
   EDITAR CUPÓN
========================================================= */

function editarCupon(
  id
) {

  const cupon =
    cupones.find(
      item =>
        item.id === id
    );


  if (!cupon) {

    return;

  }


  const form =
    buscarElemento(
      [
        "couponForm",
        "cuponForm",
        "formCoupon"
      ]
    );


  if (!form) {

    return;

  }


  rellenarFormulario(
    form,
    cupon
  );


  form.dataset.editing =
    id;


  form.scrollIntoView({
    behavior:
      "smooth",
    block:
      "center"
  });


  mostrarToast(
    "✏️ Editando cupón"
  );

}


/* =========================================================
   EDITAR OFERTA
========================================================= */

function editarOferta(
  id
) {

  const oferta =
    ofertas.find(
      item =>
        item.id === id
    );


  if (!oferta) {

    return;

  }


  const form =
    buscarElemento(
      [
        "offerForm",
        "ofertaForm",
        "formOffer"
      ]
    );


  if (!form) {

    return;

  }


  rellenarFormulario(
    form,
    oferta
  );


  form.dataset.editing =
    id;


  form.scrollIntoView({
    behavior:
      "smooth",
    block:
      "center"
  });


  mostrarToast(
    "✏️ Editando oferta"
  );

}


/* =========================================================
   RELLENAR FORMULARIO
========================================================= */

function rellenarFormulario(
  form,
  data
) {

  form.querySelectorAll(
    "input, select, textarea"
  )
    .forEach(
      input => {

        if (
          !input.name ||
          data[input.name] ===
            undefined
        ) {

          return;

        }


        if (
          input.type ===
          "checkbox"
        ) {

          input.checked =
            Boolean(
              data[input.name]
            );

        } else {

          input.value =
            data[input.name];

        }

      }
    );

}


/* =========================================================
   EDITAR USUARIO
========================================================= */

async function editarUsuario(
  id
) {

  const usuario =
    usuarios.find(
      item =>
        item.id === id
    );


  if (!usuario) {

    return;

  }


  const nuevoAhorro =
    prompt(
      `Ahorro total de ${usuario.nombre || "usuario"}:`,
      usuario.ahorroTotal ||
      0
    );


  if (
    nuevoAhorro ===
    null
  ) {

    return;

  }


  const compras =
    prompt(
      "Número de compras:",
      usuario.compras ||
      0
    );


  if (
    compras ===
    null
  ) {

    return;

  }


  const cuponesUsados =
    prompt(
      "Cupones utilizados:",
      usuario.cuponesUsados ||
      0
    );


  if (
    cuponesUsados ===
    null
  ) {

    return;

  }


  try {

    await updateDoc(
      doc(
        db,
        "usuarios",
        id
      ),
      {

        ahorroTotal:
          Number(
            nuevoAhorro
          ),

        compras:
          Number(
            compras
          ),

        cuponesUsados:
          Number(
            cuponesUsados
          )

      }
    );


    mostrarToast(
      "✅ Usuario actualizado"
    );


    await cargarTodo();

  } catch (error) {

    console.error(
      error
    );

    mostrarToast(
      "❌ No se pudo actualizar"
    );

  }

}


/* =========================================================
   ELIMINAR CUPÓN
========================================================= */

async function eliminarCupon(
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


    mostrarToast(
      "🗑️ Cupón eliminado"
    );


    await cargarTodo();

  } catch (error) {

    console.error(
      error
    );

    mostrarToast(
      "❌ No se pudo eliminar"
    );

  }

}


/* =========================================================
   ELIMINAR OFERTA
========================================================= */

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
      "🗑️ Oferta eliminada"
    );


    await cargarTodo();

  } catch (error) {

    console.error(
      error
    );

    mostrarToast(
      "❌ No se pudo eliminar"
    );

  }

}


/* =========================================================
   BUSCAR ELEMENTO POR VARIOS IDs
========================================================= */

function buscarElemento(
  ids
) {

  for (
    const id of ids
  ) {

    const element =
      document.getElementById(
        id
      );


    if (element) {

      return element;

    }

  }


  return null;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ??
    ""
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
   ESCAPE ATRIBUTO
========================================================= */

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


/* =========================================================
   FORMATEAR FECHA
========================================================= */

function formatearFecha(
  fecha
) {

  if (!fecha) {

    return "";

  }


  const partes =
    String(
      fecha
    ).split("-");


  if (
    partes.length !==
    3
  ) {

    return fecha;

  }


  return `${partes[2]}/${partes[1]}`;

}


/* =========================================================
   MENÚ ADMIN
========================================================= */

function configurarMenu() {

  const buttons =
    document.querySelectorAll(
      "[data-section]"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const section =
            button.dataset.section;


          document
            .querySelectorAll(
              ".admin-section"
            )
            .forEach(
              element => {

                element.classList.remove(
                  "active"
                );

              }
            );


          const target =
            document.getElementById(
              section
            );


          if (target) {

            target.classList.add(
              "active"
            );

          }


          document
            .querySelectorAll(
              "[data-section]"
            )
            .forEach(
              item => {

                item.classList.remove(
                  "active"
                );

              }
            );


          button.classList.add(
            "active"
          );

        }
      );

    }
  );

}


/* =========================================================
   CARGANDO
========================================================= */

function mostrarCarga(
  mostrar
) {

  const loader =
    buscarElemento(
      [
        "adminLoading",
        "loading",
        "loader"
      ]
    );


  if (!loader) {

    return;

  }


  loader.style.display =
    mostrar
      ? "flex"
      : "none";

}


/* =========================================================
   TOAST
========================================================= */

function mostrarToast(
  mensaje
) {

  let toast =
    document.getElementById(
      "adminToast"
    );


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
    mensaje;


  toast.classList.add(
    "show"
  );


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
   ACTUALIZACIÓN AUTOMÁTICA
========================================================= */

window.recargarAdmin =
  async function () {

    await cargarTodo();

  };


/* =========================================================
   FUNCIONES DISPONIBLES GLOBALMENTE
========================================================= */

window.AdminPRO = {

  cargarTodo,

  cargarCupones,

  cargarOfertas,

  cargarUsuarios,

  cargarCopias,

  cargarVisitas,

  generarEstadisticas,

  generarCuponMasCopiado,

  generarCopiasPorCupon,

  generarClicksPorDia,

  generarUsuariosPorEstado,

  generarRankingUsuarios

};


/* =========================================================
   FIN ADMIN.JS
========================================================= */