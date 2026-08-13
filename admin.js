/* =========================================================
   ⚡ EL PATRÓN DE LAS OFERTAS
   ADMIN PRO
   Firebase nuevo
   SIN FIREBASE STORAGE
   Imágenes y videos → Base64 → Firestore
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
  serverTimestamp
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
   CONFIGURACIÓN GENERAL
========================================================= */

const MAX_IMAGE_MB = 1.5;

const MAX_VIDEO_MB = 5;


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

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;

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
   VARIABLES
========================================================= */

let editingOfferId = null;

let editingCouponId = null;

let editingUserId = null;

let adminStarted = false;


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


      /*
        IMPORTANTE:

        Ya no utilizamos links de imágenes.
        El link de la OFERTA sigue siendo
        el enlace que llevará al producto.

        La imagen se guarda como Base64.
      */

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


      /*
        El enlace del producto
        puede quedar vacío si
        todavía no lo vas a utilizar.
      */

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


      /*
        Solo modificamos imagen
        si realmente se seleccionó
        una nueva.
      */

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

          /*
            Si es nueva y no hay imagen,
            se guarda como cadena vacía.
          */

          if (
            !data.imagen
          ) {

            data.imagen =
              "";

          }


          if (
            !data.video
          ) {

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

            <small>
              ${escapeHtml(
                data.categoria || ""
              )}
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

    console.error(
      error
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


      /*
        NO utilizamos un link
        de imagen.

        El cupón solamente necesita
        sus datos.
      */

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

    console.error(
      error
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


    container.innerHTML =
      "";


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
              ${data.compras || 0}
              compras
            </small>

            <small>
              ${data.cuponesUsados || 0}
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

            <small>
              Producto:
              ${escapeHtml(
                data.producto || "-"
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


    /* =====================================================
       CUPÓN MÁS COPIADO
    ===================================================== */

    const counter = {};


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
        "Sin copias todavía"
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
   EXPORTAR FUNCIONES
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

  deleteCoupon

};