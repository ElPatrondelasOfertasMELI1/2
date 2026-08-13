/* =========================================================
   ⚡ EL PATRÓN DE LAS OFERTAS
   ADMIN PRO
   Firebase 12
   SIN FIREBASE STORAGE

   FUNCIONES:
   - Ofertas
   - Cupones
   - Usuarios
   - Compras
   - Ranking
   - Estadísticas
   - Clics
   - Copias de cupones
   - Usuarios por estado
   - Verificación de capturas
   - Ahorro automático
   - Compras automáticas
   - Cupones usados automáticos
   - Imágenes Base64
   - Videos Base64
========================================================= */


import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";


import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit
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


const auth =
  getAuth(app);


const db =
  getFirestore(app);


/* =========================================================
   CONFIGURACIÓN
========================================================= */


const MAX_IMAGE_MB = 1.5;

const MAX_VIDEO_MB = 5;

const MAX_RECENT_ITEMS = 1000;


/* =========================================================
   UTILIDADES DOM
========================================================= */


const $ = selector =>
  document.querySelector(selector);


const $$ = selector =>
  document.querySelectorAll(selector);


/* =========================================================
   ESCAPAR HTML
========================================================= */


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   DINERO
========================================================= */


function money(value) {

  return Number(value || 0)
    .toLocaleString(
      "es-MX",
      {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0
      }
    );

}


/* =========================================================
   CÓDIGO CUPÓN
========================================================= */


function codeUpper(value) {

  return String(value || "")
    .trim()
    .toUpperCase();

}


/* =========================================================
   NÚMERO
========================================================= */


function numberValue(value) {

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {

    return value;

  }


  const number =
    Number(
      String(value ?? "")
        .replace(/[$,%\s,]/g, "")
    );


  return Number.isFinite(number)
    ? number
    : 0;

}


/* =========================================================
   FECHA
========================================================= */


function dateValue(value) {

  if (!value) {

    return null;

  }


  if (
    typeof value.toDate === "function"
  ) {

    return value.toDate();

  }


  if (
    value instanceof Date
  ) {

    return value;

  }


  const date =
    new Date(value);


  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;

}


/* =========================================================
   FECHA CORTA
========================================================= */


function shortDate(value) {

  const date =
    dateValue(value);


  if (!date) {

    return "-";

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


/* =========================================================
   FECHA + HORA
========================================================= */


function dateTime(value) {

  const date =
    dateValue(value);


  if (!date) {

    return "-";

  }


  return date.toLocaleString(
    "es-MX",
    {
      dateStyle: "short",
      timeStyle: "short"
    }
  );

}


/* =========================================================
   FECHA PARA AGRUPAR
========================================================= */


function dateKey(value) {

  const date =
    dateValue(value);


  if (!date) {

    return null;

  }


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    )
    .padStart(2, "0");


  const day =
    String(
      date.getDate()
    )
    .padStart(2, "0");


  return `${year}-${month}-${day}`;

}


/* =========================================================
   TEXTO SEGURO
========================================================= */


function cleanText(value) {

  return String(
    value ?? ""
  )
  .trim();

}


/* =========================================================
   MENSAJE ADMIN
========================================================= */


function showMessage(
  message,
  type = "success"
) {

  let box =
    $("#adminMessage");


  if (!box) {

    box =
      document.createElement(
        "div"
      );


    box.id =
      "adminMessage";


    box.style.position =
      "fixed";


    box.style.bottom =
      "20px";


    box.style.right =
      "20px";


    box.style.zIndex =
      "999999";


    box.style.padding =
      "14px 20px";


    box.style.borderRadius =
      "12px";


    box.style.fontWeight =
      "800";


    box.style.fontSize =
      "14px";


    box.style.boxShadow =
      "0 10px 30px rgba(0,0,0,.25)";


    document.body.appendChild(
      box
    );

  }


  box.textContent =
    message;


  box.style.background =
    type === "error"
      ? "#e53935"
      : type === "warning"
        ? "#f59e0b"
        : "#00a650";


  box.style.color =
    "#fff";


  clearTimeout(
    window.adminMessageTimer
  );


  window.adminMessageTimer =
    setTimeout(
      () => {

        if (box) {

          box.remove();

        }

      },
      3500
    );

}


/* =========================================================
   CONVERTIR ARCHIVO A BASE64
========================================================= */


function fileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload = () => {

        resolve(
          reader.result
        );

      };


      reader.onerror = () => {

        reject(
          new Error(
            "No se pudo leer el archivo."
          )
        );

      };


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* =========================================================
   VALIDAR ARCHIVO
========================================================= */


function validateFile(
  file,
  type
) {

  if (!file) {

    return {
      valid: true
    };

  }


  const maxMB =
    type === "video"
      ? MAX_VIDEO_MB
      : MAX_IMAGE_MB;


  const maxBytes =
    maxMB * 1024 * 1024;


  if (
    file.size >
    maxBytes
  ) {

    return {

      valid: false,

      message:
        `El archivo es demasiado grande. Máximo ${maxMB} MB.`

    };

  }


  if (
    type === "image" &&
    !file.type.startsWith("image/")
  ) {

    return {

      valid: false,

      message:
        "Selecciona una imagen válida."

    };

  }


  if (
    type === "video" &&
    !file.type.startsWith("video/")
  ) {

    return {

      valid: false,

      message:
        "Selecciona un video válido."

    };

  }


  return {
    valid: true
  };

}


/* =========================================================
   SET TEXT
========================================================= */


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


/* =========================================================
   SET HTML
========================================================= */


function setHtml(
  selector,
  value
) {

  const element =
    $(selector);


  if (element) {

    element.innerHTML =
      value;

  }

}


/* =========================================================
   LOGIN
========================================================= */


const loginForm =
  $("#adminLoginForm");


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const email =
        $("#adminEmail")
          ?.value
          .trim();


      const password =
        $("#adminPassword")
          ?.value;


      if (!email || !password) {

        showMessage(
          "Completa correo y contraseña.",
          "error"
        );

        return;

      }


      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


        showMessage(
          "✅ Sesión iniciada correctamente."
        );


      } catch (error) {

        console.error(
          "LOGIN:",
          error
        );


        showMessage(
          "❌ Correo o contraseña incorrectos.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   VARIABLES
========================================================= */


let editingOfferId = null;

let editingCouponId = null;

let editingUserId = null;

let editingPurchaseId = null;

let adminStarted = false;

let statisticsCache = null;


/* =========================================================
   SESIÓN
========================================================= */


onAuthStateChanged(
  auth,
  user => {

    const loginView =
      $("#adminLoginView");


    const adminView =
      $("#adminPanelView");


    if (user) {

      if (loginView) {

        loginView.style.display =
          "none";

      }


      if (adminView) {

        adminView.style.display =
          "block";

      }


      startAdmin();

    } else {

      if (loginView) {

        loginView.style.display =
          "flex";

      }


      if (adminView) {

        adminView.style.display =
          "none";

      }

    }

  }
);


/* =========================================================
   LOGOUT
========================================================= */


const logoutButton =
  $("#adminLogout");


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        showMessage(
          "Sesión cerrada."
        );

      } catch (error) {

        console.error(
          error
        );

      }

    }
  );

}


/* =========================================================
   INICIAR ADMIN
========================================================= */


function startAdmin() {

  if (adminStarted) {

    return;

  }


  adminStarted = true;


  bindOfferForm();

  bindCouponForm();

  bindUserForm();

  bindPurchaseForm();

  loadOffers();

  loadCoupons();

  loadUsers();

  loadPurchases();

  loadStatistics();

}


/* =========================================================
   OFERTAS
========================================================= */


function bindOfferForm() {

  const form =
    $("#offerForm");


  if (!form) {

    return;

  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const titulo =
        $("#offerTitle")
          ?.value
          .trim();


      const precioAntes =
        numberValue(
          $("#offerPriceBefore")
            ?.value
        );


      const precioActual =
        numberValue(
          $("#offerPriceCurrent")
            ?.value
        );


      const categoria =
        $("#offerCategory")
          ?.value
          .trim();


      const link =
        $("#offerLink")
          ?.value
          .trim();


      const imageInput =
        $("#offerImageFile");


      const videoInput =
        $("#offerVideoFile");


      if (
        !titulo ||
        !precioActual
      ) {

        showMessage(
          "Completa título y precio.",
          "error"
        );

        return;

      }


      let imagenBase64 =
        null;


      let videoBase64 =
        null;


      /* =====================================================
         IMAGEN
      ===================================================== */


      const imageFile =
        imageInput?.files?.[0];


      if (imageFile) {

        const validation =
          validateFile(
            imageFile,
            "image"
          );


        if (!validation.valid) {

          showMessage(
            validation.message,
            "error"
          );

          return;

        }


        try {

          imagenBase64 =
            await fileToBase64(
              imageFile
            );

        } catch (error) {

          console.error(
            error
          );

          showMessage(
            "No se pudo convertir la imagen.",
            "error"
          );

          return;

        }

      }


      /* =====================================================
         VIDEO
      ===================================================== */


      const videoFile =
        videoInput?.files?.[0];


      if (videoFile) {

        const validation =
          validateFile(
            videoFile,
            "video"
          );


        if (!validation.valid) {

          showMessage(
            validation.message,
            "error"
          );

          return;

        }


        try {

          videoBase64 =
            await fileToBase64(
              videoFile
            );

        } catch (error) {

          console.error(
            error
          );

          showMessage(
            "No se pudo convertir el video.",
            "error"
          );

          return;

        }

      }


      const data = {

        titulo,

        precioAntes,

        precioActual,

        categoria,

        link,

        activo: true,

        actualizado:
          serverTimestamp()

      };


      if (imagenBase64) {

        data.imagen =
          imagenBase64;

      }


      if (videoBase64) {

        data.video =
          videoBase64;

      }


      try {

        if (editingOfferId) {

          await updateDoc(
            doc(
              db,
              "ofertas",
              editingOfferId
            ),
            data
          );


          showMessage(
            "✅ Oferta actualizada."
          );

        } else {

          if (!data.imagen) {

            data.imagen =
              "";

          }


          if (!data.video) {

            data.video =
              "";

          }


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


          showMessage(
            "✅ Oferta publicada."
          );

        }


        editingOfferId =
          null;


        form.reset();


        loadOffers();

        loadStatistics();


      } catch (error) {

        console.error(
          "GUARDAR OFERTA:",
          error
        );


        showMessage(
          "❌ No se pudo guardar la oferta.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   LISTAR OFERTAS
========================================================= */


async function loadOffers() {

  const container =
    $("#adminOffersList");


  if (!container) {

    return;

  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "ofertas"
        )
      );


    container.innerHTML =
      "";


    snapshot.forEach(
      item => {

        const data =
          item.data();


        const card =
          document.createElement(
            "div"
          );


        card.className =
          "admin-item";


        card.innerHTML = `

          <div>

            ${
              data.imagen
                ? `
                  <img
                    src="${data.imagen}"
                    alt=""
                    style="
                      width:70px;
                      height:70px;
                      object-fit:cover;
                      border-radius:10px;
                      margin-bottom:8px;
                    "
                  >
                `
                : ""
            }

            <strong>
              ${escapeHtml(data.titulo)}
            </strong>

            <small>
              ${money(data.precioActual)}
            </small>

            ${
              data.precioAntes
                ? `
                  <small>
                    Antes:
                    ${money(data.precioAntes)}
                  </small>
                `
                : ""
            }

            <small>
              ${escapeHtml(
                data.categoria || ""
              )}
            </small>

            <small>
              ${
                data.activo === false
                  ? "🔴 Inactiva"
                  : "🟢 Activa"
              }
            </small>

          </div>

          <div>

            <button
              type="button"
              data-edit-offer="${item.id}"
            >
              ✏️ Editar
            </button>

            <button
              type="button"
              data-toggle-offer="${item.id}"
              data-active="${data.activo !== false}"
            >
              ${
                data.activo === false
                  ? "🟢 Activar"
                  : "🔴 Desactivar"
              }
            </button>

            <button
              type="button"
              data-delete-offer="${item.id}"
            >
              🗑️ Eliminar
            </button>

          </div>

        `;


        container.appendChild(
          card
        );

      }
    );


    container
      .querySelectorAll(
        "[data-delete-offer]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              deleteOffer(
                button.dataset.deleteOffer
              )
          );

        }
      );


    container
      .querySelectorAll(
        "[data-edit-offer]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              editOffer(
                button.dataset.editOffer
              )
          );

        }
      );


    container
      .querySelectorAll(
        "[data-toggle-offer]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              toggleOffer(
                button.dataset.toggleOffer,
                button.dataset.active === "true"
              )
          );

        }
      );


  } catch (error) {

    console.error(
      "CARGAR OFERTAS:",
      error
    );

  }

}


/* =========================================================
   EDITAR OFERTA
========================================================= */


async function editOffer(id) {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "ofertas",
          id
        )
      );


    if (!snapshot.exists()) {

      showMessage(
        "La oferta ya no existe.",
        "error"
      );

      return;

    }


    const data =
      snapshot.data();


    if ($("#offerTitle")) {

      $("#offerTitle").value =
        data.titulo || "";

    }


    if ($("#offerPriceBefore")) {

      $("#offerPriceBefore").value =
        data.precioAntes || "";

    }


    if ($("#offerPriceCurrent")) {

      $("#offerPriceCurrent").value =
        data.precioActual || "";

    }


    if ($("#offerCategory")) {

      $("#offerCategory").value =
        data.categoria || "";

    }


    if ($("#offerLink")) {

      $("#offerLink").value =
        data.link || "";

    }


    editingOfferId =
      id;


    $("#offerForm")
      ?.scrollIntoView({
        behavior: "smooth"
      });


    showMessage(
      "✏️ Editando oferta."
    );


  } catch (error) {

    console.error(
      error
    );

  }

}


/* =========================================================
   ACTIVAR / DESACTIVAR OFERTA
========================================================= */


async function toggleOffer(
  id,
  currentState
) {

  try {

    await updateDoc(
      doc(
        db,
        "ofertas",
        id
      ),
      {

        activo:
          !currentState,

        actualizado:
          serverTimestamp()

      }
    );


    showMessage(
      currentState
        ? "🔴 Oferta desactivada."
        : "🟢 Oferta activada."
    );


    loadOffers();

    loadStatistics();


  } catch (error) {

    console.error(
      error
    );


    showMessage(
      "No se pudo cambiar el estado.",
      "error"
    );

  }

}


/* =========================================================
   ELIMINAR OFERTA
========================================================= */


async function deleteOffer(id) {

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


    showMessage(
      "🗑️ Oferta eliminada."
    );


    loadOffers();

    loadStatistics();


  } catch (error) {

    console.error(
      error
    );


    showMessage(
      "❌ No se pudo eliminar.",
      "error"
    );

  }

}


/* =========================================================
   CUPONES
========================================================= */


function bindCouponForm() {

  const form =
    $("#couponForm");


  if (!form) {

    return;

  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const codigo =
        codeUpper(
          $("#couponCode")
            ?.value
        );


      const titulo =
        $("#couponTitle")
          ?.value
          .trim();


      const tipo =
        $("#couponType")
          ?.value ||
        "flash";


      const descuento =
        $("#couponDiscount")
          ?.value
          .trim();


      const minimo =
        numberValue(
          $("#couponMinimum")
            ?.value
        );


      const tope =
        numberValue(
          $("#couponTop")
            ?.value
        );


      const link =
        $("#couponLink")
          ?.value
          .trim() ||
        "https://www.mercadolibre.com.mx/";


      if (!codigo) {

        showMessage(
          "Introduce el código del cupón.",
          "error"
        );

        return;

      }


      const data = {

        codigo,

        titulo,

        tipo,

        descuento,

        minimo,

        tope,

        link,

        activo: true,

        actualizado:
          serverTimestamp()

      };


      try {

        if (editingCouponId) {

          await updateDoc(
            doc(
              db,
              "cupones",
              editingCouponId
            ),
            data
          );


          showMessage(
            "✅ Cupón actualizado."
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


          showMessage(
            "✅ Cupón publicado."
          );

        }


        editingCouponId =
          null;


        form.reset();


        loadCoupons();

        loadStatistics();


      } catch (error) {

        console.error(
          "GUARDAR CUPÓN:",
          error
        );


        showMessage(
          "❌ No se pudo guardar el cupón.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   LISTAR CUPONES
========================================================= */


async function loadCoupons() {

  const container =
    $("#adminCouponsList");


  if (!container) {

    return;

  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "cupones"
        )
      );


    const coupons =
      snapshot.docs
        .map(
          item => ({

            id:
              item.id,

            ...item.data()

          })
        )
        .filter(
          item =>
            item.activo !== false
        );


    coupons.sort(
      (a, b) => {

        const aText =
          String(
            a.descuento || ""
          );


        const bText =
          String(
            b.descuento || ""
          );


        const aFixed =
          aText.includes("$");


        const bFixed =
          bText.includes("$");


        if (
          aFixed &&
          bFixed
        ) {

          return (
            extractNumber(aText) -
            extractNumber(bText)
          );

        }


        if (aFixed) {

          return -1;

        }


        if (bFixed) {

          return 1;

        }


        return (
          Number(a.minimo || 0) -
          Number(b.minimo || 0)
        );

      }
    );


    container.innerHTML =
      "";


    coupons.forEach(
      coupon => {

        const item =
          document.createElement(
            "div"
          );


        item.className =
          "admin-item";


        item.innerHTML = `

          <div>

            <strong>
              ${escapeHtml(
                coupon.codigo
              )}
            </strong>

            <small>
              ${escapeHtml(
                coupon.descuento || ""
              )}
              · Mínimo
              ${money(
                coupon.minimo
              )}
            </small>

            <small>
              ${escapeHtml(
                coupon.titulo || ""
              )}
            </small>

            <small>
              ${
                coupon.activo === false
                  ? "🔴 Agotado"
                  : "🟢 Activo"
              }
            </small>

          </div>

          <div>

            <button
              type="button"
              data-edit-coupon="${coupon.id}"
            >
              ✏️ Editar
            </button>

            <button
              type="button"
              data-toggle-coupon="${coupon.id}"
              data-active="${coupon.activo !== false}"
            >
              ${
                coupon.activo === false
                  ? "🟢 Activar"
                  : "🔴 Agotar"
              }
            </button>

            <button
              type="button"
              data-delete-coupon="${coupon.id}"
            >
              🗑️ Eliminar
            </button>

          </div>

        `;


        container.appendChild(
          item
        );

      }
    );


    container
      .querySelectorAll(
        "[data-delete-coupon]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              deleteCoupon(
                button.dataset.deleteCoupon
              )
          );

        }
      );


    container
      .querySelectorAll(
        "[data-edit-coupon]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              editCoupon(
                button.dataset.editCoupon
              )
          );

        }
      );


    container
      .querySelectorAll(
        "[data-toggle-coupon]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              toggleCoupon(
                button.dataset.toggleCoupon,
                button.dataset.active === "true"
              )
          );

        }
      );


  } catch (error) {

    console.error(
      "CARGAR CUPONES:",
      error
    );

  }

}


/* =========================================================
   EXTRAER NÚMERO
========================================================= */


function extractNumber(value) {

  return Number(
    String(value)
      .replace(/[^\d.]/g, "")
  ) || 0;

}


/* =========================================================
   EDITAR CUPÓN
========================================================= */


async function editCoupon(id) {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "cupones",
          id
        )
      );


    if (!snapshot.exists()) {

      return;

    }


    const data =
      snapshot.data();


    if ($("#couponCode")) {

      $("#couponCode").value =
        data.codigo || "";

    }


    if ($("#couponTitle")) {

      $("#couponTitle").value =
        data.titulo || "";

    }


    if ($("#couponType")) {

      $("#couponType").value =
        data.tipo || "flash";

    }


    if ($("#couponDiscount")) {

      $("#couponDiscount").value =
        data.descuento || "";

    }


    if ($("#couponMinimum")) {

      $("#couponMinimum").value =
        data.minimo || "";

    }


    if ($("#couponTop")) {

      $("#couponTop").value =
        data.tope || "";

    }


    if ($("#couponLink")) {

      $("#couponLink").value =
        data.link || "";

    }


    editingCouponId =
      id;


    $("#couponForm")
      ?.scrollIntoView({
        behavior: "smooth"
      });


    showMessage(
      "✏️ Editando cupón."
    );


  } catch (error) {

    console.error(
      error
    );

  }

}


/* =========================================================
   ACTIVAR / DESACTIVAR CUPÓN
========================================================= */


async function toggleCoupon(
  id,
  currentState
) {

  try {

    await updateDoc(
      doc(
        db,
        "cupones",
        id
      ),
      {

        activo:
          !currentState,

        actualizado:
          serverTimestamp()

      }
    );


    showMessage(
      currentState
        ? "🔴 Cupón marcado como agotado."
        : "🟢 Cupón activado."
    );


    loadCoupons();

    loadStatistics();


  } catch (error) {

    console.error(
      error
    );


    showMessage(
      "No se pudo cambiar el estado.",
      "error"
    );

  }

}


/* =========================================================
   ELIMINAR CUPÓN
========================================================= */


async function deleteCoupon(id) {

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


    showMessage(
      "🗑️ Cupón eliminado."
    );


    loadCoupons();

    loadStatistics();


  } catch (error) {

    console.error(
      error
    );


    showMessage(
      "❌ No se pudo eliminar.",
      "error"
    );

  }

}


/* =========================================================
   USUARIOS
========================================================= */


function bindUserForm() {

  const form =
    $("#userForm");


  if (!form) {

    return;

  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const nombre =
        $("#userName")
          ?.value
          .trim();


      const email =
        $("#userEmail")
          ?.value
          .trim();


      const telefono =
        $("#userPhone")
          ?.value
          .trim();


      const estado =
        $("#userStatus")
          ?.value ||
        "pendiente";


      const estadoMexico =
        $("#userState")
          ?.value ||
        $("#userEstado")
          ?.value ||
        "";


      if (!nombre) {

        showMessage(
          "Introduce el nombre.",
          "error"
        );

        return;

      }


      try {

        await addDoc(
          collection(
            db,
            "usuarios"
          ),
          {

            nombre,

            email,

            telefono,

            estado,

            estadoMexico,

            ahorroTotal: 0,

            compras: 0,

            cuponesUsados: 0,

            fechaRegistro:
              serverTimestamp()

          }
        );


        form.reset();


        showMessage(
          "✅ Usuario agregado."
        );


        loadUsers();

        loadStatistics();


      } catch (error) {

        console.error(
          "USUARIO:",
          error
        );


        showMessage(
          "❌ No se pudo crear el usuario.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   LISTAR USUARIOS
========================================================= */


async function loadUsers() {

  const container =
    $("#adminUsersList");


  if (!container) {

    return;

  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "usuarios"
        )
      );


    const users =
      snapshot.docs
        .map(
          item => ({

            id:
              item.id,

            ...item.data()

          })
        );


    users.sort(
      (a, b) =>
        numberValue(b.ahorroTotal) -
        numberValue(a.ahorroTotal)
    );


    container.innerHTML =
      "";


    users.forEach(
      user => {

        const div =
          document.createElement(
            "div"
          );


        div.className =
          "admin-item";


        div.innerHTML = `

          <div>

            <strong>
              ${escapeHtml(
                user.nombre
              )}
            </strong>

            <small>
              ${escapeHtml(
                user.email || ""
              )}
            </small>

            <small>
              ${escapeHtml(
                user.telefono || ""
              )}
            </small>

            ${
              user.estadoMexico
                ? `
                  <small>
                    🇲🇽 ${escapeHtml(
                      user.estadoMexico
                    )}
                  </small>
                `
                : ""
            }

            <small>
              Estado:
              ${escapeHtml(
                user.estado ||
                "pendiente"
              )}
            </small>

          </div>

          <div>

            <strong>
              ${money(
                user.ahorroTotal
              )}
            </strong>

            <small>
              ${numberValue(
                user.compras
              )}
              compras
            </small>

            <small>
              ${numberValue(
                user.cuponesUsados
              )}
              cupones
            </small>

            <button
              type="button"
              data-edit-user="${user.id}"
            >
              ✏️ Editar
            </button>

          </div>

        `;


        container.appendChild(
          div
        );

      }
    );


    container
      .querySelectorAll(
        "[data-edit-user]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              editUser(
                button.dataset.editUser
              )
          );

        }
      );


  } catch (error) {

    console.error(
      "USUARIOS:",
      error
    );

  }

}


/* =========================================================
   EDITAR USUARIO
========================================================= */


async function editUser(id) {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "usuarios",
          id
        )
      );


    if (!snapshot.exists()) {

      return;

    }


    const data =
      snapshot.data();


    if ($("#userName")) {

      $("#userName").value =
        data.nombre || "";

    }


    if ($("#userEmail")) {

      $("#userEmail").value =
        data.email || "";

    }


    if ($("#userPhone")) {

      $("#userPhone").value =
        data.telefono || "";

    }


    if ($("#userStatus")) {

      $("#userStatus").value =
        data.estado || "pendiente";

    }


    if ($("#userState")) {

      $("#userState").value =
        data.estadoMexico || "";

    }


    if ($("#userEstado")) {

      $("#userEstado").value =
        data.estadoMexico || "";

    }


    editingUserId =
      id;


    const form =
      $("#userForm");


    form?.scrollIntoView({
      behavior: "smooth"
    });


    showMessage(
      "✏️ Usuario seleccionado para editar."
    );


  } catch (error) {

    console.error(
      error
    );

  }

}


/* =========================================================
   COMPRAS
========================================================= */


function bindPurchaseForm() {

  const form =
    $("#purchaseForm");


  if (!form) {

    return;

  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const usuario =
        $("#purchaseUser")
          ?.value
          .trim();


      const producto =
        $("#purchaseProduct")
          ?.value
          .trim();


      const cupon =
        $("#purchaseCoupon")
          ?.value
          .trim();


      const ahorro =
        numberValue(
          $("#purchaseSaving")
            ?.value
        );


      const estado =
        $("#purchaseStatus")
          ?.value ||
        "pendiente";


      if (!usuario) {

        showMessage(
          "Introduce el usuario.",
          "error"
        );

        return;

      }


      try {

        const data = {

          usuario,

          producto,

          cupon:
            codeUpper(cupon),

          ahorro,

          estado,

          actualizado:
            serverTimestamp()

        };


        if (editingPurchaseId) {

          await updateDoc(
            doc(
              db,
              "compras",
              editingPurchaseId
            ),
            data
          );


          showMessage(
            "✅ Compra actualizada."
          );

        } else {

          await addDoc(
            collection(
              db,
              "compras"
            ),
            {

              ...data,

              creado:
                serverTimestamp()

            }
          );


          showMessage(
            "✅ Compra registrada."
          );

        }


        editingPurchaseId =
          null;


        form.reset();


        await recalculateAllUsers();


        loadPurchases();

        loadUsers();

        loadStatistics();


      } catch (error) {

        console.error(
          "COMPRA:",
          error
        );


        showMessage(
          "❌ No se pudo guardar la compra.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   LISTAR COMPRAS
========================================================= */


async function loadPurchases() {

  const container =
    $("#adminPurchasesList");


  if (!container) {

    return;

  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "compras"
        )
      );


    const purchases =
      snapshot.docs
        .map(
          item => ({

            id:
              item.id,

            ...item.data()

          })
        );


    purchases.sort(
      (a, b) => {

        const dateA =
          dateValue(
            a.creado ||
            a.fecha ||
            a.createdAt
          )?.getTime() || 0;


        const dateB =
          dateValue(
            b.creado ||
            b.fecha ||
            b.createdAt
          )?.getTime() || 0;


        return dateB - dateA;

      }
    );


    container.innerHTML =
      "";


    purchases.forEach(
      purchase => {

        const div =
          document.createElement(
            "div"
          );


        div.className =
          "admin-item";


        const status =
          cleanText(
            purchase.estado ||
            "pendiente"
          );


        const isApproved =
          [
            "aprobada",
            "aprobado",
            "verificada",
            "completada",
            "confirmada",
            "confirmado"
          ]
          .includes(
            status.toLowerCase()
          );


        div.innerHTML = `

          <div>

            <strong>
              ${escapeHtml(
                purchase.usuarioNombre ||
                purchase.usuario ||
                "Usuario"
              )}
            </strong>

            <small>
              Cupón:
              ${escapeHtml(
                purchase.cupon || "-"
              )}
            </small>

            <small>
              Producto:
              ${escapeHtml(
                purchase.producto || "-"
              )}
            </small>

            <small>
              ${dateTime(
                purchase.creado ||
                purchase.fecha ||
                purchase.createdAt
              )}
            </small>

            <small>
              ${
                isApproved
                  ? "🟢 Verificada"
                  : "🟠 Pendiente"
              }
            </small>

          </div>

          <div>

            <strong>
              ${money(
                purchase.ahorro || 0
              )}
            </strong>

            <button
              type="button"
              data-verify-purchase="${purchase.id}"
            >
              ${
                isApproved
                  ? "↩️ Pendiente"
                  : "✅ Verificar"
              }
            </button>

            <button
              type="button"
              data-edit-purchase="${purchase.id}"
            >
              ✏️ Editar
            </button>

          </div>

        `;


        container.appendChild(
          div
        );

      }
    );


    container
      .querySelectorAll(
        "[data-verify-purchase]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              togglePurchaseVerification(
                button.dataset.verifyPurchase
              )
          );

        }
      );


    container
      .querySelectorAll(
        "[data-edit-purchase]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              editPurchase(
                button.dataset.editPurchase
              )
          );

        }
      );


  } catch (error) {

    console.error(
      "COMPRAS:",
      error
    );

  }

}


/* =========================================================
   VERIFICAR COMPRA
========================================================= */


async function togglePurchaseVerification(
  id
) {

  try {

    const reference =
      doc(
        db,
        "compras",
        id
      );


    const snapshot =
      await getDoc(
        reference
      );


    if (!snapshot.exists()) {

      showMessage(
        "La compra ya no existe.",
        "error"
      );

      return;

    }


    const data =
      snapshot.data();


    const currentStatus =
      cleanText(
        data.estado ||
        "pendiente"
      )
      .toLowerCase();


    const approved =
      [
        "aprobada",
        "aprobado",
        "verificada",
        "completada",
        "confirmada",
        "confirmado"
      ]
      .includes(
        currentStatus
      );


    await updateDoc(
      reference,
      {

        estado:
          approved
            ? "pendiente"
            : "verificada",

        verificada:
          !approved,

        verificadaAt:
          !approved
            ? serverTimestamp()
            : null,

        actualizado:
          serverTimestamp()

      }
    );


    await recalculateAllUsers();


    showMessage(
      approved
        ? "🟠 Compra regresada a pendiente."
        : "✅ Compra verificada."
    );


    loadPurchases();

    loadUsers();

    loadStatistics();


  } catch (error) {

    console.error(
      error
    );


    showMessage(
      "No se pudo actualizar la compra.",
      "error"
    );

  }

}


/* =========================================================
   EDITAR COMPRA
========================================================= */


async function editPurchase(id) {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "compras",
          id
        )
      );


    if (!snapshot.exists()) {

      return;

    }


    const data =
      snapshot.data();


    if ($("#purchaseUser")) {

      $("#purchaseUser").value =
        data.usuario ||
        data.usuarioId ||
        data.usuarioNombre ||
        "";

    }


    if ($("#purchaseProduct")) {

      $("#purchaseProduct").value =
        data.producto || "";

    }


    if ($("#purchaseCoupon")) {

      $("#purchaseCoupon").value =
        data.cupon || "";

    }


    if ($("#purchaseSaving")) {

      $("#purchaseSaving").value =
        data.ahorro || 0;

    }


    if ($("#purchaseStatus")) {

      $("#purchaseStatus").value =
        data.estado || "pendiente";

    }


    editingPurchaseId =
      id;


    $("#purchaseForm")
      ?.scrollIntoView({
        behavior: "smooth"
      });


    showMessage(
      "✏️ Editando compra."
    );


  } catch (error) {

    console.error(
      error
    );

  }

}


/* =========================================================
   RECALCULAR USUARIOS
========================================================= */


async function recalculateAllUsers() {

  try {

    const [
      usersSnapshot,
      purchasesSnapshot
    ] =
      await Promise.all([

        getDocs(
          collection(
            db,
            "usuarios"
          )
        ),

        getDocs(
          collection(
            db,
            "compras"
          )
        )

      ]);


    const users =
      usersSnapshot.docs;


    const purchases =
      purchasesSnapshot.docs
        .map(
          item => ({

            id:
              item.id,

            ...item.data()

          })
        );


    for (
      const userDoc
      of users
    ) {

      const user =
        userDoc.data();


      const userId =
        userDoc.id;


      const email =
        cleanText(
          user.email
        )
        .toLowerCase();


      const telefono =
        normalizePhone(
          user.telefono
        );


      const nombre =
        cleanText(
          user.nombre
        )
        .toLowerCase();


      const userPurchases =
        purchases.filter(
          purchase => {

            return matchUserPurchase(
              purchase,
              {
                userId,
                email,
                telefono,
                nombre
              }
            );

          }
        )
        .filter(
          purchase =>
            isApprovedPurchase(
              purchase
            )
        );


      let ahorroTotal =
        0;


      let compras =
        userPurchases.length;


      const couponSet =
        new Set();


      userPurchases.forEach(
        purchase => {

          ahorroTotal +=
            numberValue(
              purchase.ahorro ||
              purchase.ahorroTotal ||
              purchase.descuento ||
              purchase.saving
            );


          const coupon =
            codeUpper(
              purchase.cupon ||
              purchase.codigo ||
              purchase.coupon
            );


          if (coupon) {

            couponSet.add(
              coupon
            );

          }

        }
      );


      await updateDoc(
        doc(
          db,
          "usuarios",
          userId
        ),
        {

          ahorroTotal,

          compras,

          cuponesUsados:
            couponSet.size,

          rankingActualizado:
            serverTimestamp()

        }
      );

    }


    return true;

  } catch (error) {

    console.error(
      "RECALCULAR USUARIOS:",
      error
    );

    return false;

  }

}


/* =========================================================
   COMPROBAR COMPRA APROBADA
========================================================= */


function isApprovedPurchase(
  purchase
) {

  if (
    purchase.verificada === true
  ) {

    return true;

  }


  const status =
    cleanText(
      purchase.estado
    )
    .toLowerCase();


  return [
    "aprobada",
    "aprobado",
    "verificada",
    "verificado",
    "completada",
    "completado",
    "confirmada",
    "confirmado"
  ]
  .includes(
    status
  );

}


/* =========================================================
   NORMALIZAR TELÉFONO
========================================================= */


function normalizePhone(
  value
) {

  return String(
    value || ""
  )
  .replace(/\D/g, "");

}


/* =========================================================
   RELACIONAR COMPRA CON USUARIO
========================================================= */


function matchUserPurchase(
  purchase,
  user
) {

  const purchaseUserId =
    cleanText(
      purchase.usuarioId ||
      purchase.userId
    );


  if (
    purchaseUserId &&
    purchaseUserId === user.userId
  ) {

    return true;

  }


  const purchaseEmail =
    cleanText(
      purchase.usuarioEmail ||
      purchase.email
    )
    .toLowerCase();


  if (
    purchaseEmail &&
    user.email &&
    purchaseEmail === user.email
  ) {

    return true;

  }


  const purchasePhone =
    normalizePhone(
      purchase.usuarioTelefono ||
      purchase.telefono
    );


  if (
    purchasePhone &&
    user.telefono &&
    purchasePhone === user.telefono
  ) {

    return true;

  }


  const purchaseName =
    cleanText(
      purchase.usuarioNombre ||
      purchase.usuario
    )
    .toLowerCase();


  if (
    purchaseName &&
    user.nombre &&
    purchaseName === user.nombre
  ) {

    return true;

  }


  return false;

}


/* =========================================================
   ESTADÍSTICAS PRINCIPALES
========================================================= */


async function loadStatistics() {

  try {

    const [
      offers,
      coupons,
      users,
      purchases,
      copies,
      clicks
    ] =
      await Promise.all([

        getDocs(
          collection(
            db,
            "ofertas"
          )
        ),

        getDocs(
          collection(
            db,
            "cupones"
          )
        ),

        getDocs(
          collection(
            db,
            "usuarios"
          )
        ),

        getDocs(
          collection(
            db,
            "compras"
          )
        ),

        getDocs(
          collection(
            db,
            "copias"
          )
        ),

        getDocs(
          collection(
            db,
            "clics"
          )
        )

      ]);


    statisticsCache = {

      offers,

      coupons,

      users,

      purchases,

      copies,

      clicks

    };


    setText(
      "#statOffers",
      offers.size
    );


    setText(
      "#statCoupons",
      coupons.size
    );


    setText(
      "#statUsers",
      users.size
    );


    setText(
      "#statPurchases",
      purchases.size
    );


    setText(
      "#statCopies",
      copies.size
    );


    const totalSavings =
      purchases.docs.reduce(
        (total, item) => {

          const data =
            item.data();


          if (
            !isApprovedPurchase(
              data
            )
          ) {

            return total;

          }


          return total +
            numberValue(
              data.ahorro ||
              data.ahorroTotal ||
              data.descuento
            );

        },
        0
      );


    setText(
      "#statSavings",
      money(totalSavings)
    );


    /* =====================================================
       CUPÓN MÁS COPIADO
    ===================================================== */


    const counter =
      {};


    copies.forEach(
      item => {

        const data =
          item.data();


        const code =
          codeUpper(
            data.codigo ||
            data.cupon ||
            data.coupon
          );


        if (!code) {

          return;

        }


        counter[code] =
          (
            counter[code] || 0
          ) + 1;

      }
    );


    const topCoupon =
      Object.entries(
        counter
      )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )[0];


    if (topCoupon) {

      setText(
        "#topCoupon",
        `${topCoupon[0]} · ${topCoupon[1]} copias`
      );

    } else {

      setText(
        "#topCoupon",
        "Sin copias todavía"
      );

    }


    /* =====================================================
       RENDER
    ===================================================== */


    renderCouponStats(
      counter
    );


    renderRanking(
      users
    );


    renderClicksByDay(
      clicks,
      copies
    );


    renderUsersByState(
      users
    );


    renderPurchaseStats(
      purchases
    );


    renderDashboardExtraStats(
      offers,
      coupons,
      users,
      purchases,
      copies,
      clicks
    );


  } catch (error) {

    console.error(
      "ESTADÍSTICAS:",
      error
    );


    /*
      Si la colección clics todavía
      no existe o no tiene permisos,
      mostramos las demás estadísticas
      sin romper el Admin.
    */

    try {

      const [
        offers,
        coupons,
        users,
        purchases,
        copies
      ] =
        await Promise.all([

          getDocs(
            collection(
              db,
              "ofertas"
            )
          ),

          getDocs(
            collection(
              db,
              "cupones"
            )
          ),

          getDocs(
            collection(
              db,
              "usuarios"
            )
          ),

          getDocs(
            collection(
              db,
              "compras"
            )
          ),

          getDocs(
            collection(
              db,
              "copias"
            )
          )

        ]);


      setText(
        "#statOffers",
        offers.size
      );


      setText(
        "#statCoupons",
        coupons.size
      );


      setText(
        "#statUsers",
        users.size
      );


      setText(
        "#statPurchases",
        purchases.size
      );


      setText(
        "#statCopies",
        copies.size
      );


    } catch (secondError) {

      console.error(
        secondError
      );

    }

  }

}


/* =========================================================
   ESTADÍSTICAS DE CUPONES
========================================================= */


function renderCouponStats(
  counter
) {

  const container =
    $("#adminCouponStats");


  if (!container) {

    return;

  }


  const entries =
    Object.entries(
      counter
    )
    .sort(
      (a, b) =>
        b[1] - a[1]
    );


  container.innerHTML =
    "";


  if (!entries.length) {

    container.innerHTML =
      `
        <div class="admin-item">
          <strong>
            Sin copias todavía
          </strong>
        </div>
      `;

    return;

  }


  entries.forEach(
    ([code, count], index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "admin-item";


      item.innerHTML = `

        <div>

          <strong>
            #${index + 1}
            ${escapeHtml(code)}
          </strong>

          <small>
            Copias registradas
          </small>

        </div>

        <div>

          <strong>
            ${count}
          </strong>

          <small>
            copias
          </small>

        </div>

      `;


      container.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   RANKING DE USUARIOS
========================================================= */


function renderRanking(
  usersSnapshot
) {

  const container =
    $("#adminRankingList");


  if (!container) {

    return;

  }


  const users =
    usersSnapshot.docs
      .map(
        item => ({

          id:
            item.id,

          ...item.data()

        })
      )
      .sort(
        (a, b) =>
          numberValue(
            b.ahorroTotal
          ) -
          numberValue(
            a.ahorroTotal
          )
      )
      .slice(
        0,
        20
      );


  container.innerHTML =
    "";


  if (!users.length) {

    container.innerHTML =
      `
        <div class="admin-item">
          <strong>
            No hay usuarios.
          </strong>
        </div>
      `;

    return;

  }


  users.forEach(
    (user, index) => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "admin-item";


      const medal =
        index === 0
          ? "🥇"
          : index === 1
            ? "🥈"
            : index === 2
              ? "🥉"
              : `#${index + 1}`;


      div.innerHTML = `

        <div>

          <strong>
            ${medal}
            ${escapeHtml(
              user.nombre ||
              "Usuario"
            )}
          </strong>

          <small>
            ${numberValue(
              user.compras
            )}
            compras
          </small>

          <small>
            ${numberValue(
              user.cuponesUsados
            )}
            cupones usados
          </small>

        </div>

        <div>

          <strong>
            ${money(
              user.ahorroTotal
            )}
          </strong>

          <small>
            ahorro total
          </small>

        </div>

      `;


      container.appendChild(
        div
      );

    }
  );

}


/* =========================================================
   CLICS POR DÍA
========================================================= */


function renderClicksByDay(
  clicksSnapshot,
  copiesSnapshot
) {

  const canvas =
    $("#clicksChart");


  const container =
    $("#adminClicksStats");


  const daily =
    {};


  if (clicksSnapshot) {

    clicksSnapshot.forEach(
      item => {

        const data =
          item.data();


        const date =
          dateKey(
            data.fecha ||
            data.createdAt ||
            data.creado ||
            data.timestamp
          );


        if (!date) {

          return;

        }


        daily[date] =
          (
            daily[date] || 0
          ) + 1;

      }
    );

  }


  /*
    Si la colección clics todavía no
    contiene datos, usamos copias como
    referencia visual secundaria.
  */

  if (
    !Object.keys(daily).length &&
    copiesSnapshot
  ) {

    copiesSnapshot.forEach(
      item => {

        const data =
          item.data();


        const date =
          dateKey(
            data.fecha ||
            data.createdAt ||
            data.creado ||
            data.timestamp
          );


        if (!date) {

          return;

        }


        daily[date] =
          (
            daily[date] || 0
          ) + 1;

      }
    );

  }


  const entries =
    Object.entries(
      daily
    )
    .sort(
      (a, b) =>
        a[0].localeCompare(
          b[0]
        )
    )
    .slice(
      -14
    );


  if (container) {

    container.innerHTML =
      "";


    entries.forEach(
      ([date, total]) => {

        const item =
          document.createElement(
            "div"
          );


        item.className =
          "admin-item";


        item.innerHTML = `

          <div>

            <strong>
              ${escapeHtml(date)}
            </strong>

          </div>

          <div>

            <strong>
              ${total}
            </strong>

            <small>
              clics
            </small>

          </div>

        `;


        container.appendChild(
          item
        );

      }
    );

  }


  if (
    canvas
  ) {

    drawSimpleChart(
      canvas,
      entries.map(
        item => item[0]
      ),
      entries.map(
        item => item[1]
      ),
      "Clics por día"
    );

  }

}


/* =========================================================
   USUARIOS POR ESTADO
========================================================= */


function renderUsersByState(
  usersSnapshot
) {

  const container =
    $("#adminStatesList");


  const canvas =
    $("#statesChart");


  const states =
    {};


  usersSnapshot.forEach(
    item => {

      const data =
        item.data();


      const state =
        cleanText(
          data.estadoMexico ||
          data.estadoMexicano ||
          data.state ||
          data.provincia ||
          ""
        );


      if (!state) {

        return;

      }


      states[state] =
        (
          states[state] || 0
        ) + 1;

    }
  );


  const entries =
    Object.entries(
      states
    )
    .sort(
      (a, b) =>
        b[1] - a[1]
    );


  if (container) {

    container.innerHTML =
      "";


    if (!entries.length) {

      container.innerHTML =
        `
          <div class="admin-item">
            <strong>
              Todavía no hay estados registrados.
            </strong>
            <small>
              Usa el campo estadoMexico
              en los usuarios.
            </small>
          </div>
        `;

    }


    entries.forEach(
      ([state, total]) => {

        const item =
          document.createElement(
            "div"
          );


        item.className =
          "admin-item";


        item.innerHTML = `

          <div>

            <strong>
              🇲🇽 ${escapeHtml(state)}
            </strong>

          </div>

          <div>

            <strong>
              ${total}
            </strong>

            <small>
              usuarios
            </small>

          </div>

        `;


        container.appendChild(
          item
        );

      }
    );

  }


  if (canvas) {

    const chartEntries =
      entries.slice(
        0,
        10
      );


    drawSimpleChart(
      canvas,
      chartEntries.map(
        item => item[0]
      ),
      chartEntries.map(
        item => item[1]
      ),
      "Usuarios por estado"
    );

  }

}


/* =========================================================
   ESTADÍSTICAS DE COMPRAS
========================================================= */


function renderPurchaseStats(
  purchasesSnapshot
) {

  let approved =
    0;


  let pending =
    0;


  let savings =
    0;


  purchasesSnapshot.forEach(
    item => {

      const data =
        item.data();


      if (
        isApprovedPurchase(
          data
        )
      ) {

        approved++;


        savings +=
          numberValue(
            data.ahorro ||
            data.ahorroTotal ||
            data.descuento
          );

      } else {

        pending++;

      }

    }
  );


  setText(
    "#statApprovedPurchases",
    approved
  );


  setText(
    "#statPendingPurchases",
    pending
  );


  setText(
    "#statTotalSavings",
    money(savings)
  );

}


/* =========================================================
   ESTADÍSTICAS EXTRA
========================================================= */


function renderDashboardExtraStats(
  offers,
  coupons,
  users,
  purchases,
  copies,
  clicks
) {

  setText(
    "#statActiveOffers",
    offers.docs.filter(
      item =>
        item.data().activo !== false
    ).length
  );


  setText(
    "#statActiveCoupons",
    coupons.docs.filter(
      item =>
        item.data().activo !== false
    ).length
  );


  const verified =
    purchases.docs.filter(
      item =>
        isApprovedPurchase(
          item.data()
        )
    ).length;


  setText(
    "#statVerifiedPurchases",
    verified
  );


  setText(
    "#statTotalClicks",
    clicks?.size || 0
  );


  setText(
    "#statTotalUsers",
    users.size
  );


  setText(
    "#statTotalCopies",
    copies.size
  );

}


/* =========================================================
   GRÁFICA SIMPLE SIN LIBRERÍAS
========================================================= */


function drawSimpleChart(
  canvas,
  labels,
  values,
  title
) {

  if (!canvas) {

    return;

  }


  const ctx =
    canvas.getContext(
      "2d"
    );


  if (!ctx) {

    return;

  }


  const width =
    canvas.clientWidth ||
    700;


  const height =
    canvas.clientHeight ||
    300;


  const ratio =
    window.devicePixelRatio ||
    1;


  canvas.width =
    width * ratio;


  canvas.height =
    height * ratio;


  ctx.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  ctx.font =
    "bold 14px Arial";


  ctx.fillStyle =
    "#111827";


  ctx.fillText(
    title,
    20,
    25
  );


  if (!values.length) {

    ctx.font =
      "14px Arial";


    ctx.fillStyle =
      "#6b7280";


    ctx.fillText(
      "Sin datos todavía",
      20,
      60
    );


    return;

  }


  const paddingLeft =
    45;


  const paddingRight =
    20;


  const paddingTop =
    50;


  const paddingBottom =
    45;


  const chartWidth =
    width -
    paddingLeft -
    paddingRight;


  const chartHeight =
    height -
    paddingTop -
    paddingBottom;


  const max =
    Math.max(
      ...values,
      1
    );


  /* =====================================================
     EJES
  ===================================================== */


  ctx.strokeStyle =
    "#d1d5db";


  ctx.lineWidth =
    1;


  ctx.beginPath();


  ctx.moveTo(
    paddingLeft,
    paddingTop
  );


  ctx.lineTo(
    paddingLeft,
    height -
      paddingBottom
  );


  ctx.lineTo(
    width -
      paddingRight,
    height -
      paddingBottom
  );


  ctx.stroke();


  /* =====================================================
     BARRAS
  ===================================================== */


  const gap =
    8;


  const barWidth =
    Math.max(
      8,
      (
        chartWidth -
        (
          gap *
          (values.length - 1)
        )
      ) /
      values.length
    );


  values.forEach(
    (value, index) => {

      const x =
        paddingLeft +
        index *
        (
          barWidth +
          gap
        );


      const barHeight =
        (
          value /
          max
        ) *
        chartHeight;


      const y =
        height -
        paddingBottom -
        barHeight;


      ctx.fillStyle =
        "#3483fa";


      ctx.fillRect(
        x,
        y,
        barWidth,
        barHeight
      );


      ctx.fillStyle =
        "#111827";


      ctx.font =
        "11px Arial";


      ctx.textAlign =
        "center";


      ctx.fillText(
        String(value),
        x +
          barWidth /
          2,
        y -
          5
      );


      const label =
        String(
          labels[index]
        );


      let shortLabel =
        label;


      if (
        shortLabel.length >
        8
      ) {

        shortLabel =
          shortLabel.slice(
            -5
          );

      }


      ctx.fillText(
        shortLabel,
        x +
          barWidth /
          2,
        height -
          paddingBottom +
          18
      );

    }
  );


  ctx.textAlign =
    "left";

}


/* =========================================================
   ELIMINAR / LIMPIAR FORMULARIOS
========================================================= */


function resetOfferForm() {

  editingOfferId =
    null;


  $("#offerForm")
    ?.reset();

}


function resetCouponForm() {

  editingCouponId =
    null;


  $("#couponForm")
    ?.reset();

}


function resetUserForm() {

  editingUserId =
    null;


  $("#userForm")
    ?.reset();

}


function resetPurchaseForm() {

  editingPurchaseId =
    null;


  $("#purchaseForm")
    ?.reset();

}


/* =========================================================
   BOTONES DE CANCELAR
========================================================= */


document.addEventListener(
  "click",
  event => {

    const target =
      event.target;


    if (
      target.matches(
        "[data-reset-offer]"
      )
    ) {

      resetOfferForm();

    }


    if (
      target.matches(
        "[data-reset-coupon]"
      )
    ) {

      resetCouponForm();

    }


    if (
      target.matches(
        "[data-reset-user]"
      )
    ) {

      resetUserForm();

    }


    if (
      target.matches(
        "[data-reset-purchase]"
      )
    ) {

      resetPurchaseForm();

    }


    if (
      target.matches(
        "[data-refresh-admin]"
      )
    ) {

      refreshAdmin();

    }

  }
);


/* =========================================================
   REFRESCAR TODO
========================================================= */


async function refreshAdmin() {

  showMessage(
    "🔄 Actualizando Admin PRO..."
  );


  await Promise.all([

    loadOffers(),

    loadCoupons(),

    loadUsers(),

    loadPurchases(),

    loadStatistics()

  ]);


  showMessage(
    "✅ Admin PRO actualizado."
  );

}


/* =========================================================
   AUTO ACTUALIZACIÓN
========================================================= */


setInterval(
  () => {

    if (
      auth.currentUser
    ) {

      refreshAdmin();

    }

  },
  60000
);


/* =========================================================
   REDIBUJAR GRÁFICAS
========================================================= */


window.addEventListener(
  "resize",
  () => {

    if (
      !statisticsCache
    ) {

      return;

    }


    const {
      clicks,
      copies,
      users
    } =
      statisticsCache;


    renderClicksByDay(
      clicks,
      copies
    );


    renderUsersByState(
      users
    );

  }
);


/* =========================================================
   FUNCIÓN PARA REGISTRAR COPIA
========================================================= */


async function registerCouponCopy(
  codigo,
  extra = {}
) {

  const code =
    codeUpper(
      codigo
    );


  if (!code) {

    return null;

  }


  try {

    const data = {

      codigo: code,

      fecha:
        serverTimestamp(),

      creado:
        serverTimestamp(),

      usuarioId:
        extra.usuarioId ||
        null,

      usuarioEmail:
        extra.usuarioEmail ||
        null,

      usuarioNombre:
        extra.usuarioNombre ||
        null,

      ofertaId:
        extra.ofertaId ||
        null

    };


    const reference =
      await addDoc(
        collection(
          db,
          "copias"
        ),
        data
      );


    return reference.id;

  } catch (error) {

    console.error(
      "REGISTRAR COPIA:",
      error
    );


    return null;

  }

}


/* =========================================================
   FUNCIÓN PARA REGISTRAR CLIC
========================================================= */


async function registerClick(
  data = {}
) {

  try {

    const reference =
      await addDoc(
        collection(
          db,
          "clics"
        ),
        {

          tipo:
            data.tipo ||
            "oferta",

          ofertaId:
            data.ofertaId ||
            null,

          cupon:
            codeUpper(
              data.cupon
            ),

          usuarioId:
            data.usuarioId ||
            null,

          usuarioEmail:
            data.usuarioEmail ||
            null,

          fecha:
            serverTimestamp(),

          creado:
            serverTimestamp()

        }
      );


    return reference.id;

  } catch (error) {

    console.error(
      "REGISTRAR CLIC:",
      error
    );


    return null;

  }

}


/* =========================================================
   EXPONER FUNCIONES GLOBALES
========================================================= */


window.AdminPRO = {

  /* OFERTAS */

  loadOffers,

  editOffer,

  deleteOffer,

  toggleOffer,


  /* CUPONES */

  loadCoupons,

  editCoupon,

  deleteCoupon,

  toggleCoupon,


  /* USUARIOS */

  loadUsers,

  editUser,


  /* COMPRAS */

  loadPurchases,

  editPurchase,

  togglePurchaseVerification,


  /* ESTADÍSTICAS */

  loadStatistics,

  refreshAdmin,

  recalculateAllUsers,


  /* REGISTROS */

  registerCouponCopy,

  registerClick,


  /* FORMULARIOS */

  resetOfferForm,

  resetCouponForm,

  resetUserForm,

  resetPurchaseForm

};


/* =========================================================
   FINAL
========================================================= */


console.log(
  "⚡ EL PATRÓN DE LAS OFERTAS - ADMIN PRO iniciado."
);