/* =========================================================
   ⚡ EL PATRÓN DE LAS OFERTAS
   ADMIN PRO
   Firebase nuevo
   SIN FIREBASE STORAGE
   IMÁGENES / VIDEOS EN BASE64
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
  setDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   CONFIGURACIÓN FIREBASE
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
   FIREBASE
========================================================= */

const app =
  initializeApp(firebaseConfig);

const auth =
  getAuth(app);

const db =
  getFirestore(app);


/* =========================================================
   CONFIGURACIÓN MULTIMEDIA
========================================================= */

/*
   Firestore tiene límite aproximado de 1 MiB por documento.

   Por eso:

   IMAGEN:
   máximo recomendado: 700 KB

   VIDEO:
   máximo recomendado: 500 KB

   Los archivos se convierten a Base64.

   IMPORTANTE:
   Base64 aumenta el tamaño aproximadamente 33%.
*/

const MAX_IMAGE_BYTES =
  700 * 1024;

const MAX_VIDEO_BYTES =
  500 * 1024;


/* =========================================================
   UTILIDADES
========================================================= */

const $ =
  selector =>
    document.querySelector(selector);


const $$ =
  selector =>
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
   CÓDIGO CUPÓN MAYÚSCULAS
========================================================= */

function codeUpper(value) {

  return String(value || "")
    .trim()
    .toUpperCase();

}


/* =========================================================
   MENSAJES
========================================================= */

function showMessage(
  message,
  type = "success"
) {

  let box =
    $("#adminMessage");


  if (!box) {

    box =
      document.createElement("div");

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
      "0 8px 30px rgba(0,0,0,.25)";

    document.body.appendChild(
      box
    );

  }


  box.textContent =
    message;


  box.style.background =
    type === "error"
      ? "#e53935"
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


      reader.onload =
        () => {

          resolve(
            reader.result
          );

        };


      reader.onerror =
        error => {

          reject(error);

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

function validateMediaFile(file) {

  if (!file) {

    return {
      valid: true
    };

  }


  const isImage =
    file.type.startsWith(
      "image/"
    );


  const isVideo =
    file.type.startsWith(
      "video/"
    );


  if (!isImage && !isVideo) {

    return {

      valid: false,

      message:
        "❌ Solo puedes subir imágenes o videos."

    };

  }


  if (
    isImage &&
    file.size > MAX_IMAGE_BYTES
  ) {

    return {

      valid: false,

      message:
        "❌ La imagen supera 700 KB. Comprímela antes de subirla."

    };

  }


  if (
    isVideo &&
    file.size > MAX_VIDEO_BYTES
  ) {

    return {

      valid: false,

      message:
        "❌ El video supera 500 KB. Debe estar muy comprimido para guardarlo en Firestore."

    };

  }


  return {

    valid: true

  };

}


/* =========================================================
   OBTENER ARCHIVO BASE64
========================================================= */

async function getMediaBase64(
  inputSelector
) {

  const input =
    $(inputSelector);


  if (!input) {

    return null;

  }


  const file =
    input.files?.[0];


  if (!file) {

    return null;

  }


  const validation =
    validateMediaFile(
      file
    );


  if (!validation.valid) {

    throw new Error(
      validation.message
    );

  }


  return {

    base64:
      await fileToBase64(file),

    tipo:
      file.type,

    nombre:
      file.name,

    tamaño:
      file.size

  };

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
          "👋 Sesión cerrada."
        );

      } catch (error) {

        console.error(error);

      }

    }
  );

}


/* =========================================================
   VARIABLES
========================================================= */

let editingOfferId =
  null;


let editingCouponId =
  null;


let editingUserId =
  null;


let adminStarted =
  false;


/* =========================================================
   INICIAR ADMIN
========================================================= */

function startAdmin() {

  if (adminStarted) {

    return;

  }


  adminStarted =
    true;


  bindOfferForm();

  bindCouponForm();

  bindUserForm();

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
        Number(
          $("#offerPriceBefore")
            ?.value || 0
        );


      const precioActual =
        Number(
          $("#offerPriceCurrent")
            ?.value || 0
        );


      const categoria =
        $("#offerCategory")
          ?.value
          .trim();


      const link =
        $("#offerLink")
          ?.value
          .trim();


      /*
        NOTA:
        El link del producto puede seguir existiendo
        como enlace del producto.

        Lo que NO usamos son enlaces externos
        para alojar imágenes/videos.
      */


      if (
        !titulo ||
        !precioActual ||
        !link
      ) {

        showMessage(
          "Completa título, precio y enlace del producto.",
          "error"
        );

        return;

      }


      try {

        showMessage(
          "⏳ Guardando oferta..."
        );


        let multimedia =
          null;


        /*
          Buscar input multimedia.

          Puede llamarse:

          #offerMedia
          #offerImage
          #offerVideo

          El primero que exista será utilizado.
        */

        const mediaInput =
          $("#offerMedia") ||
          $("#offerImageFile") ||
          $("#offerImage") ||
          $("#offerVideo");


        if (
          mediaInput &&
          mediaInput.files &&
          mediaInput.files.length
        ) {

          const file =
            mediaInput.files[0];


          const validation =
            validateMediaFile(
              file
            );


          if (!validation.valid) {

            showMessage(
              validation.message,
              "error"
            );

            return;

          }


          multimedia = {

            base64:
              await fileToBase64(file),

            tipo:
              file.type,

            nombre:
              file.name,

            tamaño:
              file.size

          };

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


        /*
          Solo agregamos multimedia
          cuando realmente se seleccionó.
        */

        if (multimedia) {

          data.multimedia =
            multimedia;

        }


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
          error.message ||
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


    if (snapshot.empty) {

      container.innerHTML =
        "<p>No hay ofertas todavía.</p>";

      return;

    }


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


        const multimedia =
          data.multimedia;


        let mediaHTML =
          "";


        if (
          multimedia &&
          multimedia.base64
        ) {

          if (
            String(
              multimedia.tipo || ""
            )
            .startsWith("video/")
          ) {

            mediaHTML = `

              <video
                src="${multimedia.base64}"
                controls
                muted
                playsinline
                style="
                  width:90px;
                  height:70px;
                  object-fit:cover;
                  border-radius:8px;
                "
              ></video>

            `;

          } else {

            mediaHTML = `

              <img
                src="${multimedia.base64}"
                alt=""
                style="
                  width:90px;
                  height:70px;
                  object-fit:cover;
                  border-radius:8px;
                "
              >

            `;

          }

        }


        card.innerHTML = `

          ${mediaHTML}

          <div>

            <strong>
              ${escapeHtml(
                data.titulo
              )}
            </strong>

            <small>
              ${money(
                data.precioActual
              )}
            </small>

            <small>
              ${escapeHtml(
                data.categoria || ""
              )}
            </small>

          </div>

          <div>

            <button
              data-edit-offer="${item.id}"
            >
              ✏️ Editar
            </button>

            <button
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

    console.error(error);

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

    console.error(error);


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
        Number(
          $("#couponMinimum")
            ?.value || 0
        );


      const tope =
        Number(
          $("#couponTop")
            ?.value || 0
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


      try {

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


    /*
       ORDEN:

       1. Monto fijo menor
       2. Monto fijo mayor
       3. Porcentaje por mínimo
    */

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


    if (!coupons.length) {

      container.innerHTML =
        "<p>No hay cupones activos.</p>";

      return;

    }


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
                coupon.tipo || ""
              )}
            </small>

          </div>

          <div>

            <button
              data-edit-coupon="${coupon.id}"
            >
              ✏️ Editar
            </button>

            <button
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

    console.error(error);

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

    console.error(error);


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

        console.error(error);


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


    container.innerHTML =
      "";


    if (snapshot.empty) {

      container.innerHTML =
        "<p>No hay usuarios todavía.</p>";

      return;

    }


    snapshot.forEach(
      item => {

        const data =
          item.data();


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
                data.nombre
              )}
            </strong>

            <small>
              ${escapeHtml(
                data.email || ""
              )}
            </small>

            <small>
              ${escapeHtml(
                data.estado ||
                "pendiente"
              )}
            </small>

          </div>

          <div>

            <strong>
              ${money(
                data.ahorroTotal
              )}
            </strong>

            <small>
              ${Number(
                data.compras || 0
              )}
              compras
            </small>

            <small>
              ${Number(
                data.cuponesUsados || 0
              )}
              cupones
            </small>

          </div>

        `;


        container.appendChild(
          div
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
   COMPRAS
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


    container.innerHTML =
      "";


    if (snapshot.empty) {

      container.innerHTML =
        "<p>No hay compras todavía.</p>";

      return;

    }


    snapshot.forEach(
      item => {

        const data =
          item.data();


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
                data.usuarioNombre ||
                data.usuario ||
                "Usuario"
              )}
            </strong>

            <small>
              Cupón:
              ${escapeHtml(
                data.cupon || "-"
              )}
            </small>

          </div>

          <div>

            <strong>
              ${money(
                data.ahorro || 0
              )}
            </strong>

            <small>
              ${escapeHtml(
                data.estado ||
                "pendiente"
              )}
            </small>

          </div>

        `;


        container.appendChild(
          div
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
   ESTADÍSTICAS
========================================================= */

async function loadStatistics() {

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


    /*
       CUPÓN MÁS COPIADO
    */

    const counter =
      {};


    copies.forEach(
      item => {

        const data =
          item.data();


        const code =
          codeUpper(
            data.codigo
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
        "Sin datos"
      );

    }


  } catch (error) {

    console.error(
      "ESTADÍSTICAS:",
      error
    );

  }

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
   ACTUALIZACIÓN AUTOMÁTICA
========================================================= */

function listenCollection(
  collectionName,
  callback
) {

  try {

    return onSnapshot(
      collection(
        db,
        collectionName
      ),
      callback,
      error => {

        console.error(
          `Firestore ${collectionName}:`,
          error
        );

      }
    );

  } catch (error) {

    console.error(error);

  }

}


/* =========================================================
   ESCUCHAR OFERTAS
========================================================= */

listenCollection(
  "ofertas",
  () => {

    if (
      auth.currentUser
    ) {

      loadOffers();

      loadStatistics();

    }

  }
);


/* =========================================================
   ESCUCHAR CUPONES
========================================================= */

listenCollection(
  "cupones",
  () => {

    if (
      auth.currentUser
    ) {

      loadCoupons();

      loadStatistics();

    }

  }
);


/* =========================================================
   ESCUCHAR USUARIOS
========================================================= */

listenCollection(
  "usuarios",
  () => {

    if (
      auth.currentUser
    ) {

      loadUsers();

      loadStatistics();

    }

  }
);


/* =========================================================
   ESCUCHAR COMPRAS
========================================================= */

listenCollection(
  "compras",
  () => {

    if (
      auth.currentUser
    ) {

      loadPurchases();

      loadStatistics();

    }

  }
);


/* =========================================================
   EXPORTAR ADMIN PRO
========================================================= */

window.AdminPRO = {

  loadOffers,

  loadCoupons,

  loadUsers,

  loadPurchases,

  loadStatistics,

  editOffer,

  editCoupon,

  deleteOffer,

  deleteCoupon,

  showMessage

};


/* =========================================================
   FIN ADMIN PRO
========================================================= */