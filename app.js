/* ============================================================
   EL PATRÓN DE LAS OFERTAS
   APP.JS
============================================================ */

const db = firebase.firestore();

const DEFAULT_AFFILIATE =
  "https://meli.la/1mj3itE";

let autoplayTimers = {};

const visitorId =
  localStorage.getItem("epoVisitorId") ||
  crypto.randomUUID();

localStorage.setItem(
  "epoVisitorId",
  visitorId
);


/* ============================================================
   HELPERS
============================================================ */

function escapeHTML(value = "") {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function money(value) {

  const number =
    Number(value || 0);

  return number.toLocaleString(
    "es-MX",
    {
      style: "currency",
      currency: "MXN"
    }
  );

}


function imageOrPlaceholder(image) {

  if (image) {
    return image;
  }

  return `
    data:image/svg+xml;charset=UTF-8,
    <svg xmlns="http://www.w3.org/2000/svg"
    width="600" height="400">
      <rect width="100%" height="100%" fill="#f1f1f1"/>
      <text x="50%" y="50%"
      dominant-baseline="middle"
      text-anchor="middle"
      font-size="30"
      fill="#999">
      EL PATRÓN
      </text>
    </svg>
  `.replace(/\s+/g, " ");

}


/* ============================================================
   ESTADÍSTICA VISITANTE ÚNICO POR DÍA
============================================================ */

async function registrarVisitaDiaria() {

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const localKey =
    `epoVisitado_${today}`;

  if (localStorage.getItem(localKey)) {
    return;
  }

  localStorage.setItem(
    localKey,
    "1"
  );

  try {

    const ref =
      db.collection(
        "estadisticas_diarias"
      ).doc(today);

    await db.runTransaction(
      async transaction => {

        const snap =
          await transaction.get(ref);

        if (!snap.exists) {

          transaction.set(
            ref,
            {
              fecha: today,
              usuarios: 1,
              visitantes: [visitorId],
              totalVisitas: 1,
              actualizado:
                firebase.firestore.FieldValue.serverTimestamp()
            }
          );

        } else {

          const data =
            snap.data() || {};

          const visitantes =
            Array.isArray(data.visitantes)
              ? data.visitantes
              : [];

          if (
            visitantes.includes(visitorId)
          ) {
            return;
          }

          transaction.update(
            ref,
            {
              usuarios:
                Number(data.usuarios || 0) + 1,

              visitantes:
                firebase.firestore.FieldValue.arrayUnion(
                  visitorId
                ),

              totalVisitas:
                Number(data.totalVisitas || 0) + 1,

              actualizado:
                firebase.firestore.FieldValue.serverTimestamp()
            }
          );

        }

      }
    );

  } catch (error) {

    console.error(
      "Error registrando visitante:",
      error
    );

  }

}


/* ============================================================
   CARRUSEL GENÉRICO
============================================================ */

function activarCarrusel(
  container,
  dotsContainer,
  options = {}
) {

  if (!container) return;

  const {
    autoplay = false,
    interval = 3500,
    stopAfter = 12000
  } = options;

  let timer = null;

  function actualizarDots() {

    if (!dotsContainer) return;

    const cards =
      [...container.children];

    if (!cards.length) return;

    const scrollLeft =
      container.scrollLeft;

    let active = 0;
    let closest =
      Infinity;

    cards.forEach(
      (card, index) => {

        const distance =
          Math.abs(
            card.offsetLeft -
            scrollLeft
          );

        if (distance < closest) {

          closest = distance;
          active = index;

        }

      }
    );

    dotsContainer
      .querySelectorAll(".dot")
      .forEach(
        (dot, index) => {

          dot.classList.toggle(
            "active",
            index === active
          );

        }
      );

  }


  function crearDots() {

    if (!dotsContainer) return;

    dotsContainer.innerHTML = "";

    const count =
      container.children.length;

    const maxDots =
      Math.min(count, 8);

    for (
      let i = 0;
      i < maxDots;
      i++
    ) {

      const dot =
        document.createElement("span");

      dot.className =
        "dot" +
        (i === 0
          ? " active"
          : "");

      dot.addEventListener(
        "click",
        () => {

          const cards =
            [...container.children];

          if (!cards[i]) return;

          container.scrollTo({
            left:
              cards[i].offsetLeft,
            behavior: "smooth"
          });

        }
      );

      dotsContainer.appendChild(dot);

    }

  }


  function iniciarAutoplay() {

    if (!autoplay) return;

    detenerAutoplay();

    timer =
      setInterval(() => {

        const max =
          container.scrollWidth -
          container.clientWidth;

        if (container.scrollLeft >= max - 10) {

          container.scrollTo({
            left: 0,
            behavior: "smooth"
          });

        } else {

          container.scrollBy({
            left:
              container.clientWidth * .82,
            behavior: "smooth"
          });

        }

      }, interval);

    if (stopAfter > 0) {

      setTimeout(
        detenerAutoplay,
        stopAfter
      );

    }

  }


  function detenerAutoplay() {

    if (timer) {

      clearInterval(timer);
      timer = null;

    }

  }


  let touching = false;

  container.addEventListener(
    "touchstart",
    () => {

      touching = true;
      detenerAutoplay();

    },
    { passive: true }
  );


  container.addEventListener(
    "pointerdown",
    () => {

      detenerAutoplay();

    }
  );


  container.addEventListener(
    "scroll",
    () => {

      requestAnimationFrame(
        actualizarDots
      );

    },
    { passive: true }
  );


  crearDots();

  actualizarDots();

  iniciarAutoplay();

}


/* ============================================================
   OFERTAS
============================================================ */

function renderOfertas(snapshot) {

  const container =
    document.getElementById(
      "ofertasCarousel"
    );

  container.innerHTML = "";

  const docs =
    snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));


  if (!docs.length) {

    container.innerHTML =
      `<p>No hay ofertas publicadas.</p>`;

    return;

  }


  docs.forEach(
    oferta => {

      const card =
        document.createElement("article");

      card.className =
        "offer-card";

      card.innerHTML = `

        <div class="offer-image">

          <img
            src="${imageOrPlaceholder(
              oferta.imagen
            )}"
            alt="${escapeHTML(
              oferta.titulo
            )}"
            loading="lazy"
          >

        </div>

        <div class="offer-info">

          <h3>
            ${escapeHTML(
              oferta.titulo ||
              "Oferta especial"
            )}
          </h3>

          ${
            oferta.precioAntes
              ? `
                <div class="old-price">
                  ${money(
                    oferta.precioAntes
                  )}
                </div>
              `
              : ""
          }

          ${
            oferta.precioActual
              ? `
                <div class="current-price">
                  ${money(
                    oferta.precioActual
                  )}
                </div>
              `
              : ""
          }

          <a
            href="${escapeHTML(
              oferta.link ||
              DEFAULT_AFFILIATE
            )}"
            target="_blank"
            rel="noopener"
            class="offer-button"
            data-offer-id="${oferta.id}"
          >
            VER OFERTA
          </a>

        </div>

      `;

      container.appendChild(card);

    }
  );


  activarCarrusel(
    container,
    document.getElementById(
      "ofertasDots"
    ),
    {
      autoplay: true,
      interval: 3000,
      stopAfter: 15000
    }
  );

}


/* ============================================================
   CATEGORÍAS
============================================================ */

function renderCategorias(snapshot) {

  const container =
    document.getElementById(
      "categoriasCarousel"
    );

  container.innerHTML = "";

  const docs =
    snapshot.docs.map(
      doc => ({
        id: doc.id,
        ...doc.data()
      })
    );


  if (!docs.length) {

    const ejemplos = [
      ["Tecnología", "📱"],
      ["Hogar", "🏠"],
      ["Moda", "👕"],
      ["Electrónica", "🎧"],
      ["Videojuegos", "🎮"],
      ["Belleza", "💄"]
    ];

    ejemplos.forEach(
      ([nombre, icono]) => {

        const card =
          document.createElement("a");

        card.href =
          DEFAULT_AFFILIATE;

        card.target = "_blank";

        card.className =
          "category-card";

        card.innerHTML = `

          <div class="category-icon">
            ${icono}
          </div>

          ${nombre}

        `;

        container.appendChild(card);

      }
    );

  } else {

    docs.forEach(
      categoria => {

        const card =
          document.createElement("a");

        card.className =
          "category-card";

        card.href =
          categoria.link ||
          DEFAULT_AFFILIATE;

        card.target = "_blank";
        card.rel = "noopener";

        card.innerHTML = `

          ${
            categoria.imagen
              ? `
                <img
                  src="${categoria.imagen}"
                  alt="${escapeHTML(
                    categoria.nombre
                  )}"
                >
              `
              : `
                <div class="category-icon">
                  ${categoria.icono || "🛍️"}
                </div>
              `
          }

          ${escapeHTML(
            categoria.nombre ||
            "Categoría"
          )}

        `;

        container.appendChild(card);

      }
    );

  }


  activarCarrusel(
    container,
    document.getElementById(
      "categoriasDots"
    ),
    {
      autoplay: true,
      interval: 3000,
      stopAfter: 10000
    }
  );

}


/* ============================================================
   CUPONES
============================================================ */

function descuentoNumerico(cupon) {

  if (
    typeof cupon.descuento === "number"
  ) {
    return cupon.descuento;
  }

  const texto =
    String(
      cupon.descuento ||
      cupon.nombre ||
      "0"
    );

  const match =
    texto
      .replace(/,/g, "")
      .match(
        /(\d+(?:\.\d+)?)/
      );

  return match
    ? Number(match[1])
    : 0;

}


function ordenarCupones(cupones) {

  return cupones.sort(
    (a, b) =>
      descuentoNumerico(a) -
      descuentoNumerico(b)
  );

}


function estadoCupon(cupon) {

  if (
    cupon.estado === "agotado"
  ) {

    return {
      texto: "🔴 AGOTADO",
      clase: "status-ended"
    };

  }

  if (
    cupon.estado === "por_agotarse"
  ) {

    return {
      texto: "🟠 POR AGOTARSE",
      clase: "status-warning"
    };

  }

  return {
    texto: "🟢 ACTIVO",
    clase: "status-active"
  };

}


function renderCupones(
  snapshot,
  tipo,
  containerId,
  dotsId
) {

  const container =
    document.getElementById(
      containerId
    );

  container.innerHTML = "";

  let cupones =
    snapshot.docs.map(
      doc => ({
        id: doc.id,
        ...doc.data()
      })
    );


  cupones =
    cupones.filter(
      c =>
        String(c.tipo || "")
          .toLowerCase() ===
        tipo.toLowerCase()
    );


  cupones =
    ordenarCupones(cupones);


  if (!cupones.length) {

    const ejemplo =
      crearEjemploCupon(tipo);

    cupones.push(ejemplo);

  }


  cupones.forEach(
    cupon => {

      const estado =
        estadoCupon(cupon);

      const card =
        document.createElement("article");

      card.className =
        "coupon-card";

      card.dataset.id =
        cupon.id || "";

      card.innerHTML = `

        <div class="coupon-top">

          <span class="coupon-type">
            ${
              tipo === "relampago"
                ? "⚡ RELÁMPAGO"
                : tipo === "exclusivo"
                  ? "🏆 EXCLUSIVO"
                  : "🏦 BANCARIO"
            }
          </span>

          <span
            class="coupon-status ${estado.clase}"
          >
            ${estado.texto}
          </span>

        </div>


        <div class="coupon-discount">
          ${escapeHTML(
            cupon.nombre ||
            cupon.descuentoTexto ||
            "DESCUENTO"
          )}
        </div>


        ${
          cupon.minimo
            ? `
              <div class="coupon-min">
                Compra mínima:
                <strong>
                  ${money(cupon.minimo)}
                </strong>
              </div>
            `
            : ""
        }


        ${
          cupon.tope
            ? `
              <div class="coupon-min">
                Tope:
                <strong>
                  ${money(cupon.tope)}
                </strong>
              </div>
            `
            : ""
        }


        <div class="coupon-code-box">
          ${escapeHTML(
            String(
              cupon.codigo ||
              "CUPON"
            ).toUpperCase()
          )}
        </div>


        <button
          class="copy-coupon"
          data-coupon-id="${cupon.id || ""}"
          data-code="${escapeHTML(
            String(
              cupon.codigo ||
              "CUPON"
            ).toUpperCase()
          )}"
          data-link1="${escapeHTML(
            cupon.link1 ||
            DEFAULT_AFFILIATE
          )}"
          data-link2="${escapeHTML(
            cupon.link2 ||
            cupon.link1 ||
            DEFAULT_AFFILIATE
          )}"
        >
          📋 COPIAR CUPÓN
        </button>

      `;

      container.appendChild(card);

    }
  );


  container
    .querySelectorAll(
      ".copy-coupon"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          copiarCupon
        );

      }
    );


  activarCarrusel(
    container,
    document.getElementById(dotsId),
    {
      autoplay: true,
      interval: 2300,
      stopAfter: 11000
    }
  );

}


function crearEjemploCupon(tipo) {

  if (tipo === "relampago") {

    return {
      id: "demo-relampago",
      tipo: "relampago",
      nombre: "$88 OFF",
      codigo: "MELI14",
      minimo: 700,
      tope: 88,
      estado: "activo",
      link1: DEFAULT_AFFILIATE,
      link2: DEFAULT_AFFILIATE
    };

  }


  if (tipo === "exclusivo") {

    return {
      id: "demo-exclusivo",
      tipo: "exclusivo",
      nombre: "$500 OFF",
      codigo: "MELIMAS7OLA",
      minimo: 4000,
      tope: 500,
      estado: "activo",
      link1: DEFAULT_AFFILIATE,
      link2: DEFAULT_AFFILIATE
    };

  }


  return {
    id: "demo-bancario",
    tipo: "bancario",
    nombre: "10% OFF",
    codigo: "BNMXGOL26",
    minimo: 2500,
    tope: 1000,
    estado: "activo",
    link1: DEFAULT_AFFILIATE,
    link2: DEFAULT_AFFILIATE
  };

}


/* ============================================================
   COPIAR CUPÓN
============================================================ */

async function copiarCupon(event) {

  const button =
    event.currentTarget;

  const code =
    button.dataset.code;

  const couponId =
    button.dataset.couponId;

  const link1 =
    button.dataset.link1 ||
    DEFAULT_AFFILIATE;

  const link2 =
    button.dataset.link2 ||
    link1;

  try {

    await navigator.clipboard.writeText(
      code
    );

  } catch {

    const textarea =
      document.createElement("textarea");

    textarea.value = code;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

  }


  button.textContent =
    "✓ CUPÓN COPIADO";

  button.classList.add(
    "copied"
  );


  try {

    await registrarCopia(
      couponId,
      code
    );

  } catch (error) {

    console.error(error);

  }


  /*
    LINK 1 = principal
    LINK 2 = alternativo

    Por defecto ambos usan:
    https://meli.la/1mj3itE
  */

  const destino =
    link1 || link2 ||
    DEFAULT_AFFILIATE;


  setTimeout(
    () => {

      abrirMercadoLibre(
        destino
      );

    },
    150
  );

}


function abrirMercadoLibre(link) {

  if (!link) {

    link =
      DEFAULT_AFFILIATE;

  }

  /*
    El enlace universal de Mercado Libre
    permite que el sistema decida si abre
    la app o navegador.
  */

  window.location.href = link;

}


/* ============================================================
   COPIAS
============================================================ */

async function registrarCopia(
  couponId,
  codigo
) {

  const fecha =
    new Date()
      .toISOString()
      .slice(0, 10);


  const ref =
    db.collection("copias")
      .doc(
        couponId ||
        codigo
      );


  await db.runTransaction(
    async transaction => {

      const snap =
        await transaction.get(ref);

      if (!snap.exists) {

        transaction.set(
          ref,
          {
            cuponId:
              couponId || codigo,

            codigo:
              String(
                codigo
              ).toUpperCase(),

            copias: 1,

            copiasPorDia: {
              [fecha]: 1
            },

            actualizado:
              firebase.firestore.FieldValue.serverTimestamp()
          }
        );

      } else {

        const data =
          snap.data() || {};

        const dias =
          data.copiasPorDia || {};

        dias[fecha] =
          Number(
            dias[fecha] || 0
          ) + 1;

        transaction.update(
          ref,
          {
            copias:
              Number(
                data.copias || 0
              ) + 1,

            copiasPorDia:
              dias,

            actualizado:
              firebase.firestore.FieldValue.serverTimestamp()
          }
        );

      }

    }
  );


  await db.collection(
    "estadisticas"
  ).doc("global")
  .set(
    {
      totalCopias:
        firebase.firestore.FieldValue.increment(1),

      ultimaCopia:
        firebase.firestore.FieldValue.serverTimestamp()
    },
    {
      merge: true
    }
  );

}


/* ============================================================
   FIREBASE REALTIME
============================================================ */

function cargarOfertas() {

  db.collection("ofertas")
    .where(
      "publicado",
      "==",
      true
    )
    .onSnapshot(
      renderOfertas,
      error =>
        console.error(
          "Ofertas:",
          error
        )
    );

}


function cargarCategorias() {

  db.collection("categorias")
    .where(
      "publicado",
      "==",
      true
    )
    .orderBy(
      "orden",
      "asc"
    )
    .onSnapshot(
      renderCategorias,
      error => {

        console.warn(
          "Categorías:",
          error
        );

        renderCategorias({
          docs: []
        });

      }
    );

}


function cargarCupones() {

  db.collection("cupones")
    .where(
      "publicado",
      "==",
      true
    )
    .onSnapshot(
      snapshot => {

        renderCupones(
          snapshot,
          "relampago",
          "relampagoCarousel",
          "relampagoDots"
        );

        renderCupones(
          snapshot,
          "exclusivo",
          "exclusivosCarousel",
          "exclusivosDots"
        );

        renderCupones(
          snapshot,
          "bancario",
          "bancariosCarousel",
          "bancariosDots"
        );

      },
      error =>
        console.error(
          "Cupones:",
          error
        )
    );

}


/* ============================================================
   REGISTRO
============================================================ */

async function fileToBase64(file) {

  if (!file) {
    return "";
  }

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload = () =>
        resolve(
          reader.result
        );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );

    }
  );

}


async function registrarUsuario(event) {

  event.preventDefault();

  const message =
    document.getElementById(
      "registerMessage"
    );

  message.textContent =
    "Enviando registro...";


  try {

    const foto =
      document.getElementById(
        "userFoto"
      ).files[0];

    const captura =
      document.getElementById(
        "userCaptura"
      ).files[0];

    const video =
      document.getElementById(
        "userVideo"
      ).files[0];


    const fotoBase64 =
      await fileToBase64(foto);

    const capturaBase64 =
      await fileToBase64(captura);

    const videoBase64 =
      await fileToBase64(video);


    const nombre =
      document.getElementById(
        "userNombre"
      ).value.trim();

    const correo =
      document.getElementById(
        "userCorreo"
      ).value.trim();

    const telefono =
      document.getElementById(
        "userTelefono"
      ).value.trim();

    const cupon =
      document.getElementById(
        "userCupon"
      ).value
        .trim()
        .toUpperCase();


    await db.collection(
      "usuarios"
    ).add({

      nombre,

      correo,

      telefono,

      fotoBase64,

      cuponUtilizado:
        cupon,

      capturaBase64,

      videoBase64,

      estado:
        "pendiente",

      confirmado:
        false,

      ganador:
        false,

      fecha:
        firebase.firestore.FieldValue.serverTimestamp(),

      visitorId

    });


    message.textContent =
      "✓ Registro enviado correctamente. El administrador revisará tu información.";

    message.style.color =
      "#159447";


    document.getElementById(
      "registerForm"
    ).reset();


  } catch (error) {

    console.error(error);

    message.textContent =
      "No se pudo enviar el registro.";

    message.style.color =
      "#d82323";

  }

}


/* ============================================================
   MENÚ
============================================================ */

function configurarMenu() {

  const button =
    document.getElementById(
      "menuButton"
    );

  const menu =
    document.getElementById(
      "mobileMenu"
    );

  button.addEventListener(
    "click",
    () => {

      menu.classList.toggle(
        "show"
      );

    }
  );


  menu
    .querySelectorAll("a")
    .forEach(
      link => {

        link.addEventListener(
          "click",
          () => {

            menu.classList.remove(
              "show"
            );

          }
        );

      }
    );

}


/* ============================================================
   MODAL
============================================================ */

function configurarModal() {

  const modal =
    document.getElementById(
      "registerModal"
    );

  const open =
    document.getElementById(
      "openRegister"
    );

  const close =
    document.getElementById(
      "closeRegister"
    );


  open.addEventListener(
    "click",
    () => {

      modal.classList.add(
        "show"
      );

    }
  );


  close.addEventListener(
    "click",
    () => {

      modal.classList.remove(
        "show"
      );

    }
  );


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        modal.classList.remove(
          "show"
        );

      }

    }
  );


  document
    .getElementById(
      "registerForm"
    )
    .addEventListener(
      "submit",
      registrarUsuario
    );

}


/* ============================================================
   INICIO
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    configurarMenu();

    configurarModal();

    registrarVisitaDiaria();

    cargarOfertas();

    cargarCategorias();

    cargarCupones();

  }
);