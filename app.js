// =========================================================
// EL PATRÓN DE LAS OFERTAS
// APP.JS
// Página principal
// =========================================================
import {
  db,
  auth
} from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  updateDoc,
  increment,
  setDoc,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  onAuthStateChanged
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// =========================================================
// CONFIGURACIÓN
// =========================================================
const CONFIG = {
  whatsapp:
    "",
  mercadoPagoNuevoUsuario:
    "",
  autoSlideInterval:
    4500,
  offersLimit:
    20,
  couponsLimit:
    30
};
// =========================================================
// DOM
// =========================================================
const $ =
  selector =>
    document.querySelector(selector);
const $$ =
  selector =>
    document.querySelectorAll(selector);
// =========================================================
// INICIO
// =========================================================
document.addEventListener(
  "DOMContentLoaded",
  iniciarAplicacion
);
async function iniciarAplicacion() {
  establecerConfiguracionInicial();
  establecerAnio();
  configurarWhatsApp();
  configurarMercadoPago();
  configurarControlesSliders();
  configurarAutoSliders();
  observarUsuario();
  registrarVisitaDiaria();
  cargarOfertas();
  cargarCupones();
  cargarCompradorDelMes();
}
// =========================================================
// CONFIGURACIÓN INICIAL
// =========================================================
function establecerConfiguracionInicial() {
  console.log(
    "⚡ El Patrón de las Ofertas iniciado"
  );
}
// =========================================================
// AÑO
// =========================================================
function establecerAnio() {
  const year =
    $("#currentYear");
  if (year) {
    year.textContent =
      new Date().getFullYear();
  }
}
// =========================================================
// WHATSAPP
// =========================================================
function configurarWhatsApp() {
  const button =
    $("#whatsappButton");
  if (!button) {
    return;
  }
  if (!CONFIG.whatsapp) {
    button.style.display =
      "none";
    return;
  }
  button.href =
    CONFIG.whatsapp;
}
// =========================================================
// MERCADO PAGO
// =========================================================
function configurarMercadoPago() {
  const button =
    $("#mercadoPagoButton");
  if (!button) {
    return;
  }
  if (!CONFIG.mercadoPagoNuevoUsuario) {
    button.href = "#";
    button.addEventListener(
      "click",
      event => {
        event.preventDefault();
        alert(
          "El enlace de Mercado Pago todavía no ha sido configurado."
        );
      }
    );
    return;
  }
  button.href =
    CONFIG.mercadoPagoNuevoUsuario;
}
// =========================================================
// USUARIO
// =========================================================
function observarUsuario() {
  onAuthStateChanged(
    auth,
    user => {
      const loginButton =
        $("#loginButton");
      const profileButton =
        $("#profileButton");
      if (user) {
        loginButton
          ?.classList
          .add("hidden");
        profileButton
          ?.classList
          .remove("hidden");
      } else {
        loginButton
          ?.classList
          .remove("hidden");
        profileButton
          ?.classList
          .add("hidden");
      }
    }
  );
}
// =========================================================
// VISITA DIARIA
// =========================================================
//
// Cuenta máximo UNA visita por usuario/dispositivo
// cada día.
//
// Si el usuario entra 20 veces el mismo día:
// solamente cuenta 1.
// =========================================================
async function registrarVisitaDiaria() {
  try {
    const hoy =
      obtenerFechaLocal();
    const usuario =
      auth.currentUser;
    if (usuario) {
      const visitDoc =
        doc(
          db,
          "visitas",
          usuario.uid
        );
      const snapshot =
        await getDoc(visitDoc);
      if (
        snapshot.exists() &&
        snapshot.data().ultimaVisita === hoy
      ) {
        return;
      }
      await setDoc(
        visitDoc,
        {
          uid:
            usuario.uid,
          ultimaVisita:
            hoy,
          actualizado:
            serverTimestamp()
        },
        {
          merge: true
        }
      );
      await registrarVisitaGlobal(
        hoy,
        usuario.uid
      );
      return;
    }
    // -----------------------------------------------------
    // Usuario no registrado
    // -----------------------------------------------------
    const clave =
      `epo_visita_${hoy}`;
    if (
      localStorage.getItem(clave)
    ) {
      return;
    }
    localStorage.setItem(
      clave,
      "1"
    );
    await registrarVisitaGlobal(
      hoy,
      null
    );
  } catch (error) {
    console.error(
      "Error registrando visita:",
      error
    );
  }
}
// =========================================================
// REGISTRAR VISITA GLOBAL
// =========================================================
async function registrarVisitaGlobal(
  fecha,
  uid
) {
  try {
    const estadistica =
      doc(
        db,
        "estadisticas_diarias",
        fecha
      );
    const data =
      {
        fecha,
        visitas:
          increment(1),
        actualizado:
          serverTimestamp()
      };
    if (uid) {
      data.usuarios =
        increment(1);
    }
    await setDoc(
      estadistica,
      data,
      {
        merge: true
      }
    );
  } catch (error) {
    console.error(
      "Error estadística visita:",
      error
    );
  }
}
// =========================================================
// FECHA LOCAL
// =========================================================
function obtenerFechaLocal() {
  const ahora =
    new Date();
  const year =
    ahora.getFullYear();
  const month =
    String(
      ahora.getMonth() + 1
    ).padStart(
      2,
      "0"
    );
  const day =
    String(
      ahora.getDate()
    ).padStart(
      2,
      "0"
    );
  return `${year}-${month}-${day}`;
}
// =========================================================
// OFERTAS
// =========================================================
function cargarOfertas() {
  const slider =
    $("#offersSlider");
  if (!slider) {
    return;
  }
  const ofertasQuery =
    query(
      collection(
        db,
        "ofertas"
      ),
      orderBy(
        "creado",
        "desc"
      ),
      limit(
        CONFIG.offersLimit
      )
    );
  onSnapshot(
    ofertasQuery,
    snapshot => {
      slider.innerHTML = "";
      if (
        snapshot.empty
      ) {
        mostrarSinResultados(
          slider,
          "🔥",
          "No hay ofertas disponibles"
        );
        return;
      }
      snapshot.forEach(
        ofertaDoc => {
          const oferta =
            {
              id:
                ofertaDoc.id,
              ...ofertaDoc.data()
            };
          slider.appendChild(
            crearOfertaCard(
              oferta
            )
          );
        }
      );
      configurarAutoSlider(
        slider
      );
    },
    error => {
      console.error(
        "Error cargando ofertas:",
        error
      );
      mostrarError(
        slider,
        "No se pudieron cargar las ofertas."
      );
    }
  );
}
// =========================================================
// CREAR OFERTA
// =========================================================
function crearOfertaCard(
  oferta
) {
  const card =
    document.createElement(
      "article"
    );
  card.className =
    "offer-card";
  const precioAntes =
    convertirNumero(
      oferta.precioAntes
    );
  const precioActual =
    convertirNumero(
      oferta.precioActual ??
      oferta.precioFinal
    );
  let descuento =
    0;
  if (
    precioAntes > 0 &&
    precioActual > 0 &&
    precioActual < precioAntes
  ) {
    descuento =
      Math.round(
        (
          1 -
          precioActual /
          precioAntes
        ) * 100
      );
  }
  const ahorro =
    precioAntes > precioActual
      ? precioAntes - precioActual
      : 0;
  card.innerHTML = `
    <div class="offer-image-container">
      ${
        oferta.imagen
          ? `
            <img
              class="offer-image"
              src="${escaparHtml(
                oferta.imagen
              )}"
              alt="${escaparHtml(
                oferta.titulo ||
                "Oferta"
              )}"
              loading="lazy"
            >
          `
          : `
            <div
              style="
                font-size:60px;
              "
            >
              🛍️
            </div>
          `
      }
      ${
        descuento > 0
          ? `
            <span class="offer-discount">
              -${descuento}%
            </span>
          `
          : ""
      }
    </div>
    <div class="offer-content">
      <h3 class="offer-title">
        ${escaparHtml(
          oferta.titulo ||
          "Oferta especial"
        )}
      </h3>
      ${
        precioAntes > 0
          ? `
            <div class="offer-old-price">
              ${formatearPrecio(
                precioAntes
              )}
            </div>
          `
          : ""
      }
      ${
        precioActual > 0
          ? `
            <div class="offer-price">
              ${formatearPrecio(
                precioActual
              )}
            </div>
          `
          : ""
      }
      ${
        ahorro > 0
          ? `
            <div class="offer-savings">
              Ahorras ${formatearPrecio(
                ahorro
              )}
            </div>
          `
          : ""
      }
      <button
        class="offer-button"
        type="button"
        data-offer-id="${escaparHtml(
          oferta.id
        )}"
      >
        🔥 VER OFERTA
      </button>
    </div>
  `;
  const button =
    card.querySelector(
      ".offer-button"
    );
  button?.addEventListener(
    "click",
    async () => {
      await registrarClicOferta(
        oferta.id
      );
      abrirMercadoLibre(
        oferta.link
      );
    }
  );
  return card;
}
// =========================================================
// CLIC OFERTA
// =========================================================
async function registrarClicOferta(
  ofertaId
) {
  try {
    const ofertaRef =
      doc(
        db,
        "ofertas",
        ofertaId
      );
    await updateDoc(
      ofertaRef,
      {
        clics:
          increment(1)
      }
    );
    const estadisticaRef =
      doc(
        db,
        "estadisticas",
        "general"
      );
    await setDoc(
      estadisticaRef,
      {
        clics:
          increment(1),
        actualizado:
          serverTimestamp()
      },
      {
        merge: true
      }
    );
    const fecha =
      obtenerFechaLocal();
    const diariaRef =
      doc(
        db,
        "estadisticas_diarias",
        fecha
      );
    await setDoc(
      diariaRef,
      {
        fecha,
        clics:
          increment(1),
        actualizado:
          serverTimestamp()
      },
      {
        merge: true
      }
    );
  } catch (error) {
    console.error(
      "Error registrando clic:",
      error
    );
  }
}
// =========================================================
// CUPONES
// =========================================================
function cargarCupones() {
  const cuponesQuery =
    query(
      collection(
        db,
        "cupones"
      ),
      limit(
        CONFIG.couponsLimit
      )
    );
  onSnapshot(
    cuponesQuery,
    snapshot => {
      const flash =
        $("#flashCouponsSlider");
      const exclusive =
        $("#exclusiveCouponsSlider");
      const bank =
        $("#bankCouponsSlider");
      if (flash) {
        flash.innerHTML = "";
      }
      if (exclusive) {
        exclusive.innerHTML = "";
      }
      if (bank) {
        bank.innerHTML = "";
      }
      if (
        snapshot.empty
      ) {
        mostrarSinResultados(
          flash,
          "🎟️",
          "No hay cupones relámpago"
        );
        mostrarSinResultados(
          exclusive,
          "👑",
          "No hay cupones exclusivos"
        );
        mostrarSinResultados(
          bank,
          "🏦",
          "No hay cupones bancarios"
        );
        return;
      }
      snapshot.forEach(
        couponDoc => {
          const coupon =
            {
              id:
                couponDoc.id,
              ...couponDoc.data()
            };
          const tipo =
            normalizarTipoCupon(
              coupon.tipo
            );
          const card =
            crearCuponCard(
              coupon
            );
          if (
            tipo === "relampago"
          ) {
            flash?.appendChild(
              card
            );
          } else if (
            tipo === "exclusivo"
          ) {
            exclusive?.appendChild(
              card
            );
          } else if (
            tipo === "bancario"
          ) {
            bank?.appendChild(
              card
            );
          }
        }
      );
      verificarSliderVacio(
        flash,
        "⚡",
        "No hay cupones relámpago"
      );
      verificarSliderVacio(
        exclusive,
        "👑",
        "No hay cupones exclusivos"
      );
      verificarSliderVacio(
        bank,
        "🏦",
        "No hay cupones bancarios"
      );
      configurarAutoSlider(
        flash
      );
      configurarAutoSlider(
        exclusive
      );
      configurarAutoSlider(
        bank
      );
    },
    error => {
      console.error(
        "Error cargando cupones:",
        error
      );
    }
  );
}
// =========================================================
// CREAR CUPÓN
// =========================================================
function crearCuponCard(
  coupon
) {
  const card =
    document.createElement(
      "article"
    );
  card.className =
    "coupon-card";
  const estado =
    obtenerEstadoCupon(
      coupon
    );
  const tipoTexto =
    obtenerNombreTipo(
      coupon.tipo
    );
  const descuento =
    coupon.descuento ??
    coupon.monto ??
    coupon.valor ??
    "";
  const minimo =
    coupon.compraMinima ??
    coupon.minimo ??
    coupon.compra_minima ??
    "";
  const tope =
    coupon.tope ??
    coupon.maximo ??
    "";
  const copias =
    Number(
      coupon.copias ||
      coupon.copiado ||
      coupon.copies ||
      0
    );
  const codigo =
    String(
      coupon.codigo ||
      coupon.code ||
      "CUPON"
    ).toUpperCase();
  card.innerHTML = `
    <span
      class="coupon-status ${estado.clase}"
    >
      ${estado.icono}
      ${estado.texto}
    </span>
    <div class="coupon-type">
      ${tipoTexto}
    </div>
    <div class="coupon-discount">
      ${formatearDescuento(
        descuento
      )}
    </div>
    <div class="coupon-code">
      ${escaparHtml(
        codigo
      )}
    </div>
    <div class="coupon-info">
      ${
        minimo
          ? `
            <span>
              🛒 Compra mínima:
              ${formatearNumero(
                minimo
              )}
            </span>
          `
          : ""
      }
      ${
        tope
          ? `
            <span>
              💰 Tope:
              ${formatearNumero(
                tope
              )}
            </span>
          `
          : ""
      }
    </div>
    <button
      type="button"
      class="coupon-copy-button"
    >
      📋 COPIAR CUPÓN
    </button>
    <div class="coupon-copies">
      🔥 ${copias} copias
    </div>
  `;
  const button =
    card.querySelector(
      ".coupon-copy-button"
    );
  button?.addEventListener(
    "click",
    async event => {
      event.preventDefault();
      event.stopPropagation();
      await copiarCupon(
        coupon,
        codigo,
        button
      );
    }
  );
  return card;
}
// =========================================================
// COPIAR CUPÓN
// =========================================================
async function copiarCupon(
  coupon,
  codigo,
  button
) {
  try {
    await navigator.clipboard.writeText(
      codigo
    );
  } catch {
    copiarFallback(
      codigo
    );
  }
  button.textContent =
    "✅ ¡COPIADO!";
  setTimeout(
    () => {
      button.textContent =
        "📋 COPIAR CUPÓN";
    },
    1800
  );
  await registrarCopiaCupon(
    coupon
  );
  if (
    coupon.link
  ) {
    setTimeout(
      () => {
        abrirMercadoLibre(
          coupon.link
        );
      },
      150
    );
  }
}
// =========================================================
// REGISTRAR COPIA CUPÓN
// =========================================================
async function registrarCopiaCupon(
  coupon
) {
  try {
    const couponRef =
      doc(
        db,
        "cupones",
        coupon.id
      );
    await updateDoc(
      couponRef,
      {
        copias:
          increment(1)
      }
    );
    const generalRef =
      doc(
        db,
        "estadisticas",
        "general"
      );
    await setDoc(
      generalRef,
      {
        copiasCupones:
          increment(1),
        actualizado:
          serverTimestamp()
      },
      {
        merge: true
      }
    );
    const fecha =
      obtenerFechaLocal();
    const diariaRef =
      doc(
        db,
        "estadisticas_diarias",
        fecha
      );
    await setDoc(
      diariaRef,
      {
        fecha,
        copiasCupones:
          increment(1),
        actualizado:
          serverTimestamp()
      },
      {
        merge: true
      }
    );
  } catch (error) {
    console.error(
      "Error registrando copia:",
      error
    );
  }
}
// =========================================================
// ESTADO CUPÓN
// =========================================================
function obtenerEstadoCupon(
  coupon
) {
  const activo =
    coupon.activo !== false &&
    coupon.estado !== "agotado" &&
    coupon.estado !== "AGOTADO";
  if (!activo) {
    return {
      texto:
        "AGOTADO",
      clase:
        "expired",
      icono:
        "🔴"
    };
  }
  if (
    coupon.porAgotarse === true
  ) {
    return {
      texto:
        "POR AGOTARSE",
      clase:
        "warning",
      icono:
        "🟠"
    };
  }
  return {
    texto:
      "ACTIVO",
    clase:
      "active",
    icono:
      "🟢"
  };
}
// =========================================================
// TIPO CUPÓN
// =========================================================
function normalizarTipoCupon(
  tipo
) {
  const valor =
    String(
      tipo || ""
    )
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );
  if (
    valor.includes(
      "relamp"
    ) ||
    valor.includes(
      "flash"
    )
  ) {
    return "relampago";
  }
  if (
    valor.includes(
      "exclus"
    ) ||
    valor.includes(
      "meli+"
    ) ||
    valor.includes(
      "meli"
    )
  ) {
    return "exclusivo";
  }
  if (
    valor.includes(
      "bancar"
    ) ||
    valor.includes(
      "banco"
    )
  ) {
    return "bancario";
  }
  return valor;
}
// =========================================================
// NOMBRE TIPO
// =========================================================
function obtenerNombreTipo(
  tipo
) {
  const normalizado =
    normalizarTipoCupon(
      tipo
    );
  if (
    normalizado ===
    "relampago"
  ) {
    return "⚡ CUPÓN RELÁMPAGO";
  }
  if (
    normalizado ===
    "exclusivo"
  ) {
    return "👑 CUPÓN EXCLUSIVO";
  }
  if (
    normalizado ===
    "bancario"
  ) {
    return "🏦 CUPÓN BANCARIO";
  }
  return "🎟️ CUPÓN";
}
// =========================================================
// COMPRADOR DEL MES
// =========================================================
async function cargarCompradorDelMes() {
  const contenedor =
    $("#buyerMonthPreview");
  if (!contenedor) {
    return;
  }
  try {
    const ref =
      doc(
        db,
        "configuracion",
        "comprador_mes"
      );
    const snapshot =
      await getDoc(
        ref
      );
    if (
      !snapshot.exists()
    ) {
      return;
    }
    const data =
      snapshot.data();
    if (
      data.activo === false
    ) {
      return;
    }
    contenedor.innerHTML = `
      ${
        data.foto
          ? `
            <img
              src="${escaparHtml(
                data.foto
              )}"
              alt="Comprador del mes"
              class="buyer-placeholder"
              style="
                object-fit:cover;
              "
            >
          `
          : `
            <div class="buyer-placeholder">
              👤
            </div>
          `
      }
      <strong>
        ${escaparHtml(
          data.nombre ||
          "Comprador del mes"
        )}
      </strong>
      ${
        data.ahorro
          ? `
            <span>
              💰 Ahorró
              ${formatearNumero(
                data.ahorro
              )}
            </span>
          `
          : ""
      }
    `;
  } catch (error) {
    console.error(
      "Error comprador mes:",
      error
    );
  }
}
// =========================================================
// SLIDERS
// =========================================================
function configurarControlesSliders() {
  $$(
    "[data-slider-prev]"
  ).forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          const id =
            button.dataset.sliderPrev;
          const slider =
            document.getElementById(
              id
            );
          if (!slider) {
            return;
          }
          slider.scrollBy(
            {
              left:
                -slider.clientWidth * 0.8,
              behavior:
                "smooth"
            }
          );
        }
      );
    }
  );
  $$(
    "[data-slider-next]"
  ).forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          const id =
            button.dataset.sliderNext;
          const slider =
            document.getElementById(
              id
            );
          if (!slider) {
            return;
          }
          slider.scrollBy(
            {
              left:
                slider.clientWidth * 0.8,
              behavior:
                "smooth"
            }
          );
        }
      );
    }
  );
}
// =========================================================
// AUTO SLIDERS
// =========================================================
function configurarAutoSliders() {
  [
    "categoriesSlider",
    "offersSlider",
    "flashCouponsSlider",
    "exclusiveCouponsSlider",
    "bankCouponsSlider"
  ].forEach(
    id => {
      const slider =
        document.getElementById(
          id
        );
      if (slider) {
        configurarAutoSlider(
          slider
        );
      }
    }
  );
}
function configurarAutoSlider(
  slider
) {
  if (!slider) {
    return;
  }
  if (
    slider.dataset.autoConfigured ===
    "true"
  ) {
    return;
  }
  slider.dataset.autoConfigured =
    "true";
  let intervalo =
    null;
  const iniciar =
    () => {
      detener();
      intervalo =
        setInterval(
          () => {
            if (
              slider.scrollWidth <=
              slider.clientWidth
            ) {
              return;
            }
            const maxScroll =
              slider.scrollWidth -
              slider.clientWidth;
            const siguiente =
              slider.scrollLeft +
              slider.clientWidth * 0.75;
            if (
              siguiente >=
              maxScroll - 10
            ) {
              slider.scrollTo(
                {
                  left: 0,
                  behavior: "smooth"
                }
              );
            } else {
              slider.scrollTo(
                {
                  left: siguiente,
                  behavior: "smooth"
                }
              );
            }
          },
          CONFIG.autoSlideInterval
        );
    };
  const detener =
    () => {
      if (intervalo) {
        clearInterval(
          intervalo
        );
        intervalo =
          null;
      }
    };
  slider.addEventListener(
    "mouseenter",
    detener
  );
  slider.addEventListener(
    "mouseleave",
    iniciar
  );
  slider.addEventListener(
    "touchstart",
    detener,
    {
      passive: true
    }
  );
  slider.addEventListener(
    "touchend",
    () => {
      setTimeout(
        iniciar,
        2500
      );
    },
    {
      passive: true
    }
  );
  iniciar();
}
// =========================================================
// MERCADO LIBRE
// =========================================================
function abrirMercadoLibre(
  link
) {
  if (!link) {
    return;
  }
  let url =
    String(
      link
    ).trim();
  if (
    !url.startsWith(
      "http://"
    ) &&
    !url.startsWith(
      "https://"
    )
  ) {
    url =
      "https://" +
      url;
  }
  // -------------------------------------------------------
  // Intent Android
  // -------------------------------------------------------
  const esAndroid =
    /Android/i.test(
      navigator.userAgent
    );
  if (
    esAndroid &&
    /mercadolibre/i.test(
      url
    )
  ) {
    try {
      const parsed =
        new URL(
          url
        );
      const intentUrl =
        `intent://${parsed.host}${parsed.pathname}${parsed.search}` +
        `#Intent;scheme=${parsed.protocol.replace(
          ":",
          ""
        )};package=com.mercadolibre;end`;
      window.location.href =
        intentUrl;
      return;
    } catch {
      // Continúa con apertura normal.
    }
  }
  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}
// =========================================================
// HELPERS
// =========================================================
function convertirNumero(
  value
) {
  if (
    typeof value ===
    "number"
  ) {
    return value;
  }
  if (!value) {
    return 0;
  }
  const limpio =
    String(value)
      .replace(
        /[$,%\s]/g,
        ""
      )
      .replace(
        /,/g,
        ""
      );
  const numero =
    Number(
      limpio
    );
  return Number.isFinite(
    numero
  )
    ? numero
    : 0;
}
function formatearPrecio(
  numero
) {
  return new Intl.NumberFormat(
    "es-MX",
    {
      style:
        "currency",
      currency:
        "MXN",
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2
    }
  ).format(
    numero
  );
}
function formatearNumero(
  numero
) {
  const valor =
    convertirNumero(
      numero
    );
  return new Intl.NumberFormat(
    "es-MX",
    {
      style:
        "currency",
      currency:
        "MXN",
      minimumFractionDigits:
        0,
      maximumFractionDigits:
        0
    }
  ).format(
    valor
  );
}
function formatearDescuento(
  descuento
) {
  if (
    descuento ===
    null ||
    descuento ===
    undefined ||
    descuento === ""
  ) {
    return "DESCUENTO";
  }
  const texto =
    String(
      descuento
    ).trim();
  if (
    texto.includes("%")
  ) {
    return texto;
  }
  if (
    texto.includes("$")
  ) {
    return texto;
  }
  const numero =
    convertirNumero(
      descuento
    );
  if (
    numero <= 0
  ) {
    return texto;
  }
  return `$${numero.toLocaleString(
    "es-MX"
  )} OFF`;
}
// =========================================================
// ESCAPE HTML
// =========================================================
function escaparHtml(
  valor
) {
  return String(
    valor ??
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
// =========================================================
// FALLBACK COPIAR
// =========================================================
function copiarFallback(
  texto
) {
  const textarea =
    document.createElement(
      "textarea"
    );
  textarea.value =
    texto;
  textarea.style.position =
    "fixed";
  textarea.style.opacity =
    "0";
  document.body.appendChild(
    textarea
  );
  textarea.select();
  try {
    document.execCommand(
      "copy"
    );
  } catch (error) {
    console.error(
      "No se pudo copiar:",
      error
    );
  }
  textarea.remove();
}
// =========================================================
// SLIDER VACÍO
// =========================================================
function verificarSliderVacio(
  slider,
  icono,
  mensaje
) {
  if (!slider) {
    return;
  }
  if (
    slider.children.length ===
    0
  ) {
    mostrarSinResultados(
      slider,
      icono,
      mensaje
    );
  }
}
function mostrarSinResultados(
  contenedor,
  icono,
  mensaje
) {
  if (!contenedor) {
    return;
  }
  contenedor.innerHTML = `
    <div class="loading-card">
      <div
        style="
          font-size:38px;
        "
      >
        ${icono}
      </div>
      <p>
        ${mensaje}
      </p>
    </div>
  `;
}
function mostrarError(
  contenedor,
  mensaje
) {
  if (!contenedor) {
    return;
  }
  contenedor.innerHTML = `
    <div class="loading-card">
      <div
        style="
          font-size:38px;
        "
      >
        ⚠️
      </div>
      <p>
        ${mensaje}
      </p>
    </div>
  `;
}
// =========================================================
// EXPONER FUNCIONES
// =========================================================
//
// Esto permite que futuros archivos del proyecto puedan
// reutilizar determinadas funciones sin duplicarlas.
// =========================================================
window.ElPatronOfertas = {
  abrirMercadoLibre,
  formatearPrecio,
  formatearNumero,
  obtenerFechaLocal
};