/* =========================================================
   EL PATRÓN DE LAS OFERTAS
   ADMIN PRO
   FIREBASE NUEVO
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
   CONSTANTES
========================================================= */

/*
  Firestore tiene límite de 1 MiB por documento.

  Dejamos margen de seguridad para los demás campos
  del documento.

  IMÁGENES:
  se comprimen automáticamente.

  VIDEOS:
  solo se permiten archivos pequeños.
*/

const MAX_BASE64_BYTES =
  700 * 1024;

const MAX_VIDEO_BYTES =
  500 * 1024;

const IMAGE_MAX_WIDTH =
  1200;

const IMAGE_MAX_HEIGHT =
  1200;

const IMAGE_QUALITY =
  0.72;


/* =========================================================
   VARIABLES
========================================================= */

let editingOfferId = null;

let editingCouponId = null;

let adminStarted = false;

let listenersStarted = false;


/* =========================================================
   UTILIDADES DOM
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
   CÓDIGO CUPÓN
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
      "14px 18px";

    box.style.borderRadius =
      "12px";

    box.style.fontWeight =
      "800";

    box.style.fontFamily =
      "Arial, sans-serif";

    box.style.boxShadow =
      "0 8px 30px rgba(0,0,0,.20)";

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
   VALIDAR SESIÓN
========================================================= */

function requireAuth() {

  if (!auth.currentUser) {

    showMessage(
      "❌ Debes iniciar sesión.",
      "error"
    );

    return false;

  }

  return true;

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
        $("#adminEmail")?.value.trim();


      const password =
        $("#adminPassword")?.value;


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
          "LOGOUT:",
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

  if (adminStarted) return;

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

  startRealtimeListeners();

}


/* =========================================================
   BASE64
========================================================= */

/*
  Convierte un archivo en Base64.
*/

function fileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        () => resolve(
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


/* =========================================================
   OBTENER TAMAÑO APROXIMADO BASE64
========================================================= */

function base64Size(base64) {

  if (!base64) return 0;


  const comma =
    base64.indexOf(",");


  const pure =
    comma >= 0
      ? base64.substring(
          comma + 1
        )
      : base64;


  return Math.ceil(
    pure.length * 0.75
  );

}


/* =========================================================
   COMPRIMIR IMAGEN
========================================================= */

async function compressImage(
  file
) {

  if (!file) {

    return null;

  }


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    throw new Error(
      "El archivo seleccionado no es una imagen."
    );

  }


  const imageUrl =
    URL.createObjectURL(
      file
    );


  try {

    const image =
      await new Promise(
        (resolve, reject) => {

          const img =
            new Image();


          img.onload =
            () => resolve(img);


          img.onerror =
            () =>
              reject(
                new Error(
                  "No se pudo cargar la imagen."
                )
              );


          img.src =
            imageUrl;

        }
      );


    let width =
      image.width;


    let height =
      image.height;


    const ratio =
      Math.min(
        IMAGE_MAX_WIDTH / width,
        IMAGE_MAX_HEIGHT / height,
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


    let quality =
      IMAGE_QUALITY;


    let base64 =
      canvas.toDataURL(
        "image/jpeg",
        quality
      );


    /*
      Si todavía es grande,
      seguimos reduciendo calidad.
    */

    while (
      base64Size(base64) >
        MAX_BASE64_BYTES &&
      quality > 0.30
    ) {

      quality -=
        0.08;


      base64 =
        canvas.toDataURL(
          "image/jpeg",
          quality
        );

    }


    if (
      base64Size(base64) >
        MAX_BASE64_BYTES
    ) {

      throw new Error(
        "La imagen sigue siendo demasiado grande después de comprimirla."
      );

    }


    return base64;


  } finally {

    URL.revokeObjectURL(
      imageUrl
    );

  }

}


/* =========================================================
   PROCESAR VIDEO
========================================================= */

async function processVideo(
  file
) {

  if (!file) {

    return null;

  }


  if (
    !file.type.startsWith(
      "video/"
    )
  ) {

    throw new Error(
      "El archivo seleccionado no es un video."
    );

  }


  if (
    file.size >
      MAX_VIDEO_BYTES
  ) {

    throw new Error(
      "El video es demasiado grande para guardarlo en Firestore. Máximo recomendado: 500 KB."
    );

  }


  const base64 =
    await fileToBase64(
      file
    );


  if (
    base64Size(base64) >
      MAX_BASE64_BYTES
  ) {

    throw new Error(
      "El video convertido supera el tamaño permitido."
    );

  }


  return base64;

}


/* =========================================================
   OBTENER ARCHIVO DE IMAGEN
========================================================= */

function getImageFile() {

  const input =
    $("#offerImageFile");


  if (
    input &&
    input.files &&
    input.files[0]
  ) {

    return input.files[0];

  }


  return null;

}


/* =========================================================
   OBTENER ARCHIVO DE VIDEO
========================================================= */

function getVideoFile() {

  const input =
    $("#offerVideoFile");


  if (
    input &&
    input.files &&
    input.files[0]
  ) {

    return input.files[0];

  }


  return null;

}


/* =========================================================
   OFERTAS
========================================================= */

function bindOfferForm() {

  const form =
    $("#offerForm");


  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!requireAuth()) {

        return;

      }


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


      if (
        !titulo ||
        !precioActual ||
        !link
      ) {

        showMessage(
          "Completa título, precio actual y enlace de Mercado Libre.",
          "error"
        );

        return;

      }


      const imageFile =
        getImageFile();


      const videoFile =
        getVideoFile();


      const existing =
        editingOfferId
          ? await getDoc(
              doc(
                db,
                "ofertas",
                editingOfferId
              )
            )
          : null;


      let oldData =
        existing?.exists()
          ? existing.data()
          : {};


      let imagenBase64 =
        oldData.imagenBase64 ||
        "";


      let videoBase64 =
        oldData.videoBase64 ||
        "";


      try {

        /*
          IMAGEN
        */

        if (imageFile) {

          showMessage(
            "⏳ Comprimiendo imagen..."
          );


          imagenBase64 =
            await compressImage(
              imageFile
            );

        }


        /*
          VIDEO
        */

        if (videoFile) {

          showMessage(
            "⏳ Procesando video..."
          );


          videoBase64 =
            await processVideo(
              videoFile
            );

        }


        /*
          DATOS
        */

        const data = {

          titulo,

          precioAntes,

          precioActual,

          categoria,

          link,

          imagenBase64,

          videoBase64,

          activo: true,

          actualizado:
            serverTimestamp()

        };


        /*
          ACTUALIZAR
        */

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


        }

        /*
          CREAR
        */

        else {

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
          "❌ " +
          (
            error.message ||
            "No se pudo guardar la oferta."
          ),
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


  if (!container) return;


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


        const image =
          data.imagenBase64
            ? `
              <img
                src="${data.imagenBase64}"
                alt=""
                style="
                  width:60px;
                  height:60px;
                  object-fit:cover;
                  border-radius:10px;
                "
              >
            `
            : "";


        card.innerHTML = `

          <div
            style="
              display:flex;
              align-items:center;
              gap:12px;
            "
          >

            ${image}

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

              ${
                data.videoBase64
                  ? `
                    <small>
                      🎥 Video incluido
                    </small>
                  `
                  : ""
              }

            </div>

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
      "LISTAR OFERTAS:",
      error
    );

  }

}


/* =========================================================
   EDITAR OFERTA
========================================================= */

async function editOffer(
  id
) {

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
        "La oferta no existe.",
        "error"
      );

      return;

    }


    const data =
      snapshot.data();


    $("#offerTitle").value =
      data.titulo || "";


    $("#offerPriceBefore").value =
      data.precioAntes || "";


    $("#offerPriceCurrent").value =
      data.precioActual || "";


    $("#offerCategory").value =
      data.categoria || "";


    $("#offerLink").value =
      data.link || "";


    /*
      Si el HTML antiguo tiene offerImage,
      no lo usamos como URL.

      La imagen ahora se maneja con
      #offerImageFile.
    */

    if (
      $("#offerImage")
    ) {

      $("#offerImage").value =
        "";

    }


    if (
      $("#offerImageFile")
    ) {

      $("#offerImageFile").value =
        "";

    }


    if (
      $("#offerVideoFile")
    ) {

      $("#offerVideoFile").value =
        "";

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
      "EDITAR OFERTA:",
      error
    );

  }

}


/* =========================================================
   ELIMINAR OFERTA
========================================================= */

async function deleteOffer(
  id
) {

  if (
    !requireAuth()
  ) {

    return;

  }


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
      "ELIMINAR OFERTA:",
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


  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!requireAuth()) {

        return;

      }


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


  if (!container) return;


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
      Orden:

      1. Monto fijo menor
      2. Monto fijo mayor
      3. Porcentaje por mínimo ascendente
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


        if (aFixed) return -1;

        if (bFixed) return 1;


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
      "LISTAR CUPONES:",
      error
    );

  }

}


/* =========================================================
   EXTRAER NÚMERO
========================================================= */

function extractNumber(
  value
) {

  return Number(
    String(value)
      .replace(
        /[^\d.]/g,
        ""
      )
  ) || 0;

}


/* =========================================================
   EDITAR CUPÓN
========================================================= */

async function editCoupon(
  id
) {

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

      showMessage(
        "El cupón no existe.",
        "error"
      );

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
      "EDITAR CUPÓN:",
      error
    );

  }

}


/* =========================================================
   ELIMINAR CUPÓN
========================================================= */

async function deleteCoupon(
  id
) {

  if (
    !requireAuth()
  ) {

    return;

  }


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
      "ELIMINAR CUPÓN:",
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


  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!requireAuth()) {

        return;

      }


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
          "CREAR USUARIO:",
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


  if (!container) return;


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
              ·
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
              ${
                data.compras || 0
              }
              compras
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
      "LISTAR USUARIOS:",
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


  if (!container) return;


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

    /*
      Si compras todavía no existe,
      Firestore simplemente devolverá
      una colección vacía.
    */

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

  if (!auth.currentUser) {

    return;

  }


  try {

    const results =
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


    const offers =
      results[0];


    const coupons =
      results[1];


    const users =
      results[2];


    const purchases =
      results[3];


    const copies =
      results[4];


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
            data.codigo ||
            data.cupon
          );


        if (!code) return;


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
   LISTENERS FIRESTORE
========================================================= */

function startRealtimeListeners() {

  if (listenersStarted) return;

  listenersStarted =
    true;


  /*
    OFERTAS
  */

  onSnapshot(
    collection(
      db,
      "ofertas"
    ),
    () => {

      if (
        auth.currentUser
      ) {

        loadOffers();

        loadStatistics();

      }

    },
    error => {

      console.error(
        "Listener ofertas:",
        error
      );

    }
  );


  /*
    CUPONES
  */

  onSnapshot(
    collection(
      db,
      "cupones"
    ),
    () => {

      if (
        auth.currentUser
      ) {

        loadCoupons();

        loadStatistics();

      }

    },
    error => {

      console.error(
        "Listener cupones:",
        error
      );

    }
  );


  /*
    USUARIOS
  */

  onSnapshot(
    collection(
      db,
      "usuarios"
    ),
    () => {

      if (
        auth.currentUser
      ) {

        loadUsers();

        loadStatistics();

      }

    },
    error => {

      console.error(
        "Listener usuarios:",
        error
      );

    }
  );

}


/* =========================================================
   PREVISUALIZACIÓN DE IMAGEN
========================================================= */

const imageInput =
  $("#offerImageFile");


if (imageInput) {

  imageInput.addEventListener(
    "change",
    async () => {

      const file =
        imageInput.files?.[0];


      if (!file) return;


      try {

        showMessage(
          "⏳ Preparando imagen..."
        );


        const base64 =
          await compressImage(
            file
          );


        let preview =
          $("#offerImagePreview");


        if (!preview) {

          preview =
            document.createElement(
              "img"
            );

          preview.id =
            "offerImagePreview";

          preview.style.maxWidth =
            "220px";

          preview.style.maxHeight =
            "220px";

          preview.style.objectFit =
            "cover";

          preview.style.borderRadius =
            "12px";

          preview.style.display =
            "block";

          preview.style.marginTop =
            "10px";


          imageInput.parentNode
            ?.appendChild(
              preview
            );

        }


        preview.src =
          base64;


        showMessage(
          "✅ Imagen lista."
        );


      } catch (error) {

        console.error(
          "IMAGEN:",
          error
        );


        imageInput.value =
          "";


        showMessage(
          "❌ " +
          error.message,
          "error"
        );

      }

    }
  );

}


/* =========================================================
   VALIDAR VIDEO ANTES DE GUARDAR
========================================================= */

const videoInput =
  $("#offerVideoFile");


if (videoInput) {

  videoInput.addEventListener(
    "change",
    () => {

      const file =
        videoInput.files?.[0];


      if (!file) return;


      if (
        !file.type.startsWith(
          "video/"
        )
      ) {

        videoInput.value =
          "";


        showMessage(
          "❌ Selecciona un archivo de video.",
          "error"
        );


        return;

      }


      if (
        file.size >
          MAX_VIDEO_BYTES
      ) {

        videoInput.value =
          "";


        showMessage(
          "❌ Video demasiado grande. Máximo 500 KB.",
          "error"
        );


        return;

      }


      showMessage(
        "✅ Video compatible."
      );

    }
  );

}


/* =========================================================
   EXPORTAR
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

  compressImage,

  processVideo

};