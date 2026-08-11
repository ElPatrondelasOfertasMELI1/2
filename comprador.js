// =========================================================
// COMPRADOR.JS
// Comprador del mes + ranking
// =========================================================
import {
  db
} from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const winnerSection =
  document.getElementById(
    "winnerSection"
  );
const publicRanking =
  document.getElementById(
    "publicRanking"
  );
const prizeTitle =
  document.getElementById(
    "prizeTitle"
  );
const prizeDescription =
  document.getElementById(
    "prizeDescription"
  );
// =========================================================
// INICIO
// =========================================================
document.addEventListener(
  "DOMContentLoaded",
  async () => {
    await cargarGanador();
    await cargarPremio();
    await cargarRanking();
  }
);
// =========================================================
// GANADOR
// =========================================================
async function cargarGanador() {
  try {
    const reference =
      doc(
        db,
        "configuracion",
        "comprador_mes"
      );
    const snapshot =
      await getDoc(
        reference
      );
    if (
      !snapshot.exists()
    ) {
      mostrarSinGanador();
      return;
    }
    const winner =
      snapshot.data();
    if (
      winner.activo ===
      false
    ) {
      mostrarSinGanador();
      return;
    }
    winnerSection.innerHTML = `
      <article class="winner-card">
        ${
          winner.foto
            ? `
              <img
                src="${escaparHtml(
                  winner.foto
                )}"
                alt="Comprador del mes"
                class="winner-photo"
              >
            `
            : `
              <div
                class="winner-photo"
                style="
                  display:grid;
                  place-items:center;
                  font-size:50px;
                "
              >
                👤
              </div>
            `
        }
        <div class="winner-info">
          <span>
            👑 GANADOR
          </span>
          <h2>
            ${escaparHtml(
              winner.nombre ||
              "Comprador del Mes"
            )}
          </h2>
          <div class="winner-saving">
            💰
            ${formatearPrecio(
              winner.ahorro ||
              0
            )}
            ahorrados
          </div>
          ${
            winner.premio
              ? `
                <div class="winner-prize">
                  🎁 Premio:
                  ${escaparHtml(
                    winner.premio
                  )}
                </div>
              `
              : ""
          }
        </div>
      </article>
    `;
  } catch (error) {
    console.error(
      "Error ganador:",
      error
    );
    mostrarSinGanador();
  }
}
// =========================================================
// PREMIO
// =========================================================
async function cargarPremio() {
  try {
    const reference =
      doc(
        db,
        "configuracion",
        "comprador_mes"
      );
    const snapshot =
      await getDoc(
        reference
      );
    if (
      !snapshot.exists()
    ) {
      return;
    }
    const data =
      snapshot.data();
    if (
      data.premio
    ) {
      prizeTitle.textContent =
        data.premio;
    }
    if (
      data.descripcionPremio
    ) {
      prizeDescription.textContent =
        data.descripcionPremio;
    }
  } catch (error) {
    console.error(
      "Error premio:",
      error
    );
  }
}
// =========================================================
// RANKING
// =========================================================
async function cargarRanking() {
  try {
    const rankingQuery =
      query(
        collection(
          db,
          "usuarios"
        ),
        orderBy(
          "ahorroTotal",
          "desc"
        ),
        limit(10)
      );
    const snapshot =
      await getDocs(
        rankingQuery
      );
    publicRanking.innerHTML =
      "";
    if (
      snapshot.empty
    ) {
      publicRanking.innerHTML = `
        <div class="winner-loading">
          🏆 Todavía no hay usuarios en el ranking.
        </div>
      `;
      return;
    }
    let posicion =
      0;
    snapshot.forEach(
      userDoc => {
        posicion++;
        const user =
          userDoc.data();
        publicRanking.appendChild(
          crearRankingItem(
            user,
            posicion
          )
        );
      }
    );
  } catch (error) {
    console.error(
      "Error ranking:",
      error
    );
    publicRanking.innerHTML = `
      <div class="winner-loading">
        ⚠️ No se pudo cargar el ranking.
      </div>
    `;
  }
}
// =========================================================
// ITEM RANKING
// =========================================================
function crearRankingItem(
  user,
  posicion
) {
  const item =
    document.createElement(
      "article"
    );
  item.className =
    "ranking-row";
  const medallas = {
    1:
      "🥇",
    2:
      "🥈",
    3:
      "🥉"
  };
  const posicionTexto =
    medallas[
      posicion
    ] ||
    `#${posicion}`;
  const nombre =
    user.nombre ||
    "Usuario";
  const estado =
    user.estado ||
    "México";
  item.innerHTML = `
    <div class="ranking-position">
      ${posicionTexto}
    </div>
    ${
      user.foto
        ? `
          <img
            src="${escaparHtml(
              user.foto
            )}"
            class="ranking-photo"
            alt=""
          >
        `
        : `
          <div
            class="ranking-photo"
            style="
              display:grid;
              place-items:center;
              font-size:18px;
            "
          >
            👤
          </div>
        `
    }
    <div class="ranking-name">
      ${escaparHtml(
        nombre
      )}
      <small>
        📍 ${escaparHtml(
          estado
        )}
      </small>
    </div>
    <div class="ranking-saving">
      ${formatearPrecio(
        user.ahorroTotal ||
        0
      )}
    </div>
  `;
  return item;
}
// =========================================================
// SIN GANADOR
// =========================================================
function mostrarSinGanador() {
  winnerSection.innerHTML = `
    <div class="winner-loading">
      <div
        style="
          font-size:50px;
        "
      >
        🏆
      </div>
      <p>
        Todavía no tenemos ganador.
      </p>
      <p>
        ¡Registra tus compras y participa!
      </p>
    </div>
  `;
}
// =========================================================
// HELPERS
// =========================================================
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