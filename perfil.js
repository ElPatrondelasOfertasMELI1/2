// =========================================================
// PERFIL.JS
// Perfil + fotos + compras + capturas
// =========================================================
import {
  auth,
  db,
  storage
} from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  updateProfile
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  increment
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
// =========================================================
// DOM
// =========================================================
const profilePhoto =
  document.getElementById(
    "profilePhoto"
  );
const photoInput =
  document.getElementById(
    "photoInput"
  );
const profileName =
  document.getElementById(
    "profileName"
  );
const profileEmail =
  document.getElementById(
    "profileEmail"
  );
const profileState =
  document.getElementById(
    "profileState"
  );
const totalSavings =
  document.getElementById(
    "totalSavings"
  );
const totalPurchases =
  document.getElementById(
    "totalPurchases"
  );
const totalCoupons =
  document.getElementById(
    "totalCoupons"
  );
const totalVisits =
  document.getElementById(
    "totalVisits"
  );
const logoutButton =
  document.getElementById(
    "logoutButton"
  );
const openPurchaseButton =
  document.getElementById(
    "openPurchaseButton"
  );
const purchaseFormSection =
  document.getElementById(
    "purchaseFormSection"
  );
const cancelPurchaseButton =
  document.getElementById(
    "cancelPurchaseButton"
  );
const purchaseForm =
  document.getElementById(
    "purchaseForm"
  );
const purchaseMessage =
  document.getElementById(
    "purchaseMessage"
  );
const purchaseHistory =
  document.getElementById(
    "purchaseHistory"
  );
// =========================================================
// ESTADO
// =========================================================
let currentUser =
  null;
let currentProfile =
  null;
// =========================================================
// AUTENTICACIÓN
// =========================================================
onAuthStateChanged(
  auth,
  async user => {
    if (!user) {
      window.location.href =
        "./login.html";
      return;
    }
    currentUser =
      user;
    await cargarPerfil(
      user
    );
    escucharCompras(
      user.uid
    );
  }
);
// =========================================================
// PERFIL
// =========================================================
async function cargarPerfil(
  user
) {
  try {
    const ref =
      doc(
        db,
        "usuarios",
        user.uid
      );
    const snapshot =
      await getDoc(
        ref
      );
    if (
      snapshot.exists()
    ) {
      currentProfile =
        snapshot.data();
    } else {
      currentProfile =
        {
          uid:
            user.uid,
          nombre:
            user.displayName ||
            "Usuario",
          email:
            user.email ||
            "",
          ahorroTotal:
            0,
          compras:
            0,
          cuponesUsados:
            0,
          visitas:
            0
        };
    }
    mostrarPerfil(
      currentProfile,
      user
    );
  } catch (error) {
    console.error(
      "Error perfil:",
      error
    );
  }
}
// =========================================================
// MOSTRAR PERFIL
// =========================================================
function mostrarPerfil(
  data,
  user
) {
  const nombre =
    data.nombre ||
    user.displayName ||
    "Usuario";
  profileName.textContent =
    nombre;
  profileEmail.textContent =
    data.email ||
    user.email ||
    "";
  profileState.textContent =
    `📍 ${
      data.estado ||
      "México"
    }`;
  totalSavings.textContent =
    formatearPrecio(
      data.ahorroTotal
    );
  totalPurchases.textContent =
    Number(
      data.compras ||
      0
    );
  totalCoupons.textContent =
    Number(
      data.cuponesUsados ||
      0
    );
  totalVisits.textContent =
    Number(
      data.visitas ||
      0
    );
  if (
    data.foto
  ) {
    profilePhoto.src =
      data.foto;
  } else {
    profilePhoto.src =
      crearAvatar(
        nombre
      );
  }
}
// =========================================================
// FOTO
// =========================================================
photoInput?.addEventListener(
  "change",
  async event => {
    const file =
      event.target.files?.[0];
    if (!file) {
      return;
    }
    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      mostrarMensaje(
        "❌ Selecciona una imagen válida.",
        "error"
      );
      return;
    }
    if (
      file.size >
      5 * 1024 * 1024
    ) {
      mostrarMensaje(
        "❌ La imagen no debe superar 5 MB.",
        "error"
      );
      return;
    }
    try {
      mostrarMensaje(
        "⏳ Subiendo foto...",
        ""
      );
      const extension =
        obtenerExtension(
          file.name
        );
      const storageRef =
        ref(
          storage,
          `usuarios/${currentUser.uid}/perfil.${extension}`
        );
      await uploadBytes(
        storageRef,
        file
      );
      const url =
        await getDownloadURL(
          storageRef
        );
      await setDoc(
        doc(
          db,
          "usuarios",
          currentUser.uid
        ),
        {
          foto:
            url,
          actualizado:
            serverTimestamp()
        },
        {
          merge: true
        }
      );
      await updateProfile(
        currentUser,
        {
          photoURL:
            url
        }
      );
      profilePhoto.src =
        url;
      mostrarMensaje(
        "✅ Foto actualizada.",
        "success"
      );
    } catch (error) {
      console.error(
        error
      );
      mostrarMensaje(
        "❌ No se pudo subir la foto.",
        "error"
      );
    }
  }
);
// =========================================================
// ABRIR FORMULARIO
// =========================================================
openPurchaseButton?.addEventListener(
  "click",
  () => {
    purchaseFormSection.classList.remove(
      "hidden"
    );
    purchaseFormSection.scrollIntoView(
      {
        behavior:
          "smooth"
      }
    );
  }
);
// =========================================================
// CANCELAR
// =========================================================
cancelPurchaseButton?.addEventListener(
  "click",
  () => {
    purchaseForm.reset();
    purchaseFormSection.classList.add(
      "hidden"
    );
    purchaseMessage.textContent =
      "";
  }
);
// =========================================================
// ENVIAR COMPRA
// =========================================================
purchaseForm?.addEventListener(
  "submit",
  async event => {
    event.preventDefault();
    if (!currentUser) {
      return;
    }
    const product =
      document
        .getElementById(
          "purchaseProduct"
        )
        .value
        .trim();
    const price =
      Number(
        document
          .getElementById(
            "purchasePrice"
          )
          .value
      );
    const savings =
      Number(
        document
          .getElementById(
            "purchaseSavings"
          )
          .value
      );
    const coupon =
      document
        .getElementById(
          "purchaseCoupon"
        )
        .value
        .trim()
        .toUpperCase();
    const file =
      document
        .getElementById(
          "purchaseScreenshot"
        )
        .files?.[0];
    if (!file) {
      mostrarCompraMensaje(
        "❌ Selecciona la captura.",
        "error"
      );
      return;
    }
    if (
      file.size >
      5 * 1024 * 1024
    ) {
      mostrarCompraMensaje(
        "❌ La captura no debe superar 5 MB.",
        "error"
      );
      return;
    }
    if (
      price < 0 ||
      savings < 0
    ) {
      mostrarCompraMensaje(
        "❌ Los precios no pueden ser negativos.",
        "error"
      );
      return;
    }
    const submitButton =
      document.getElementById(
        "submitPurchaseButton"
      );
    submitButton.disabled =
      true;
    submitButton.textContent =
      "⏳ SUBIENDO...";
    try {
      // ---------------------------------------------------
      // STORAGE
      // ---------------------------------------------------
      const extension =
        obtenerExtension(
          file.name
        );
      const path =
        `compras/${currentUser.uid}/${Date.now()}.${extension}`;
      const storageRef =
        ref(
          storage,
          path
        );
      await uploadBytes(
        storageRef,
        file
      );
      const screenshotURL =
        await getDownloadURL(
          storageRef
        );
      // ---------------------------------------------------
      // FIRESTORE
      // ---------------------------------------------------
      await addDoc(
        collection(
          db,
          "compras"
        ),
        {
          uid:
            currentUser.uid,
          usuarioNombre:
            currentProfile?.nombre ||
            currentUser.displayName ||
            "Usuario",
          usuarioEmail:
            currentUser.email ||
            "",
          producto:
            product,
          precio:
            price,
          ahorro:
            savings,
          cupon:
            coupon,
          captura:
            screenshotURL,
          estado:
            "pendiente",
          creado:
            serverTimestamp(),
          actualizado:
            serverTimestamp()
        }
      );
      mostrarCompraMensaje(
        "✅ Compra enviada. Quedará pendiente de verificación.",
        "success"
      );
      purchaseForm.reset();
      submitButton.disabled =
        false;
      submitButton.textContent =
        "✅ ENVIAR A VERIFICACIÓN";
      setTimeout(
        () => {
          purchaseFormSection.classList.add(
            "hidden"
          );
        },
        1800
      );
    } catch (error) {
      console.error(
        "Error compra:",
        error
      );
      mostrarCompraMensaje(
        "❌ No se pudo enviar la compra.",
        "error"
      );
      submitButton.disabled =
        false;
      submitButton.textContent =
        "✅ ENVIAR A VERIFICACIÓN";
    }
  }
);
// =========================================================
// HISTORIAL
// =========================================================
function escucharCompras(
  uid
) {
  const comprasQuery =
    query(
      collection(
        db,
        "compras"
      ),
      where(
        "uid",
        "==",
        uid
      ),
      orderBy(
        "creado",
        "desc"
      )
    );
  onSnapshot(
    comprasQuery,
    snapshot => {
      purchaseHistory.innerHTML =
        "";
      if (
        snapshot.empty
      ) {
        purchaseHistory.innerHTML = `
          <div class="empty-history">
            🛍️ Todavía no tienes compras registradas.
          </div>
        `;
        return;
      }
      snapshot.forEach(
        purchaseDoc => {
          const purchase =
            purchaseDoc.data();
          purchaseHistory.appendChild(
            crearCompraItem(
              purchase
            )
          );
        }
      );
    },
    error => {
      console.error(
        "Error historial:",
        error
      );
      purchaseHistory.innerHTML = `
        <div class="empty-history">
          ⚠️ No se pudo cargar el historial.
        </div>
      `;
    }
  );
}
// =========================================================
// COMPRA ITEM
// =========================================================
function crearCompraItem(
  purchase
) {
  const item =
    document.createElement(
      "article"
    );
  item.className =
    "purchase-item";
  const estado =
    String(
      purchase.estado ||
      "pendiente"
    ).toLowerCase();
  let estadoTexto =
    "PENDIENTE";
  let estadoClase =
    "pending";
  if (
    estado ===
    "aprobada" ||
    estado ===
    "aprobado" ||
    estado ===
    "verificada"
  ) {
    estadoTexto =
      "VERIFICADA";
    estadoClase =
      "approved";
  }
  if (
    estado ===
    "rechazada" ||
    estado ===
    "rechazado"
  ) {
    estadoTexto =
      "RECHAZADA";
    estadoClase =
      "rejected";
  }
  item.innerHTML = `
    ${
      purchase.captura
        ? `
          <img
            class="purchase-image"
            src="${escaparHtml(
              purchase.captura
            )}"
            alt="Compra"
          >
        `
        : `
          <div
            class="purchase-image"
            style="
              display:grid;
              place-items:center;
              font-size:25px;
            "
          >
            🧾
          </div>
        `
    }
    <div>
      <h3>
        ${escaparHtml(
          purchase.producto ||
          "Compra"
        )}
      </h3>
      <p>
        💰 Ahorraste
        ${formatearPrecio(
          purchase.ahorro ||
          0
        )}
      </p>
      ${
        purchase.cupon
          ? `
            <p>
              🎟️ ${escaparHtml(
                purchase.cupon
              )}
            </p>
          `
          : ""
      }
    </div>
    <span
      class="purchase-status ${estadoClase}"
    >
      ${estadoTexto}
    </span>
  `;
  return item;
}
// =========================================================
// LOGOUT
// =========================================================
logoutButton?.addEventListener(
  "click",
  async () => {
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
      mostrarMensaje(
        "❌ No se pudo cerrar sesión.",
        "error"
      );
    }
  }
);
// =========================================================
// MENSAJES
// =========================================================
function mostrarCompraMensaje(
  text,
  type
) {
  purchaseMessage.textContent =
    text;
  purchaseMessage.className =
    "profile-message";
  if (type) {
    purchaseMessage.classList.add(
      type
    );
  }
}
function mostrarMensaje(
  text,
  type
) {
  const element =
    document.getElementById(
      "globalMessage"
    );
  if (!element) {
    return;
  }
  element.textContent =
    text;
  element.className =
    "global-message show";
  if (
    type ===
    "error"
  ) {
    element.style.background =
      "#e53935";
  } else if (
    type ===
    "success"
  ) {
    element.style.background =
      "#00a650";
  } else {
    element.style.background =
      "#171717";
  }
  setTimeout(
    () => {
      element.classList.remove(
        "show"
      );
    },
    2500
  );
}
// =========================================================
// HELPERS
// =========================================================
function formatearPrecio(
  value
) {
  const numero =
    Number(
      value ||
      0
    );
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
    numero
  );
}
function obtenerExtension(
  nombre
) {
  const partes =
    String(
      nombre
    ).split(".");
  return (
    partes[
      partes.length - 1
    ] ||
    "jpg"
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    );
}
function crearAvatar(
  nombre
) {
  const inicial =
    String(
      nombre ||
      "U"
    )
      .trim()
      .charAt(0)
      .toUpperCase();
  return `
    data:image/svg+xml;charset=UTF-8,
    ${encodeURIComponent(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="300"
        height="300"
      >
        <rect
          width="300"
          height="300"
          fill="#ffe600"
        />
        <text
          x="50%"
          y="55%"
          text-anchor="middle"
          font-family="Arial"
          font-size="150"
          font-weight="900"
          fill="#171717"
        >
          ${inicial}
        </text>
      </svg>
    `)}
  `;
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