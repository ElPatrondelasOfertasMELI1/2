/* =========================================================
   EL PATRÓN DE LAS OFERTAS
   ADMIN PRO
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

  apiKey: "TU_API_KEY",

  authDomain:
    "TU_PROYECTO.firebaseapp.com",

  projectId:
    "TU_PROJECT_ID",

  storageBucket:
    "TU_PROYECTO.firebasestorage.app",

  messagingSenderId:
    "TU_MESSAGING_SENDER_ID",

  appId:
    "TU_APP_ID"

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
   UTILIDADES
========================================================= */

const $ = selector =>
  document.querySelector(selector);


const $$ = selector =>
  document.querySelectorAll(selector);


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function money(value) {

  return Number(value || 0)
    .toLocaleString(
      "es-MX",
      {
        style:"currency",
        currency:"MXN",
        maximumFractionDigits:0
      }
    );

}


function codeUpper(value) {

  return String(value || "")
    .trim()
    .toUpperCase();

}


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
      "99999";

    box.style.padding =
      "13px 18px";

    box.style.borderRadius =
      "10px";

    box.style.fontWeight =
      "800";

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

        box.remove();

      },
      3500
    );

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

        console.error(error);


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

      await signOut(auth);

      showMessage(
        "Sesión cerrada."
      );

    }
  );

}


/* =========================================================
   VARIABLES
========================================================= */

let editingOfferId = null;

let editingCouponId = null;

let adminStarted = false;


/* =========================================================
   INICIAR ADMIN
========================================================= */

function startAdmin() {

  if (adminStarted) return;

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


  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const titulo =
        $("#offerTitle")?.value.trim();


      const precioAntes =
        Number(
          $("#offerPriceBefore")?.value || 0
        );


      const precioActual =
        Number(
          $("#offerPriceCurrent")?.value || 0
        );


      const categoria =
        $("#offerCategory")?.value.trim();


      const link =
        $("#offerLink")?.value.trim();


      const imagen =
        $("#offerImage")?.value.trim() || "";


      if (!titulo || !precioActual || !link) {

        showMessage(
          "Completa título, precio y enlace.",
          "error"
        );

        return;

      }


      const data = {

        titulo,

        precioAntes,

        precioActual,

        categoria,

        link,

        imagen,

        activo:true,

        actualizado:
          serverTimestamp()

      };


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


      } catch (error) {

        console.error(error);

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


        card.innerHTML = `

          <div>

            <strong>
              ${escapeHtml(data.titulo)}
            </strong>

            <small>
              ${money(data.precioActual)}
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

    console.error(error);

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


    if ($("#offerImage")) {

      $("#offerImage").value =
        data.imagen || "";

    }


    editingOfferId =
      id;


    $("#offerForm")?.scrollIntoView({
      behavior:"smooth"
    });


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


  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const codigo =
        codeUpper(
          $("#couponCode")?.value
        );


      const titulo =
        $("#couponTitle")?.value.trim();


      const tipo =
        $("#couponType")?.value ||
        "flash";


      const descuento =
        $("#couponDiscount")?.value.trim();


      const minimo =
        Number(
          $("#couponMinimum")?.value || 0
        );


      const tope =
        Number(
          $("#couponTop")?.value || 0
        );


      const link =
        $("#couponLink")?.value.trim() ||
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

        activo:true,

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


      } catch (error) {

        console.error(error);

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
            id:item.id,
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
      (a,b) => {

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
              ${escapeHtml(coupon.codigo)}
            </strong>

            <small>
              ${escapeHtml(coupon.descuento || "")}
              · Mínimo ${money(coupon.minimo)}
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

    console.error(error);

  }

}


function extractNumber(value) {

  return Number(
    String(value)
      .replace(/[^\d.]/g,"")
  ) || 0;

}


/* =========================================================
   EDITAR CUPÓN
========================================================= */

async function editCoupon(id) {

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


  $("#couponForm")?.scrollIntoView({
    behavior:"smooth"
  });

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


  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const nombre =
        $("#userName")?.value.trim();


      const email =
        $("#userEmail")?.value.trim();


      const telefono =
        $("#userPhone")?.value.trim();


      const estado =
        $("#userStatus")?.value ||
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

            ahorroTotal:0,

            compras:0,

            cuponesUsados:0,

            fechaRegistro:
              serverTimestamp()

          }
        );


        form.reset();


        showMessage(
          "✅ Usuario agregado."
        );


        loadUsers();


      } catch (error) {

        console.error(error);

        showMessage(
          "❌ No se pudo crear.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   USUARIOS
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
              ${escapeHtml(data.nombre)}
            </strong>

            <small>
              ${escapeHtml(data.email || "")}
              · ${escapeHtml(data.estado || "pendiente")}
            </small>

          </div>

          <div>

            <strong>
              ${money(data.ahorroTotal)}
            </strong>

            <small>
              ${data.compras || 0} compras
            </small>

          </div>

        `;


        container.appendChild(
          div
        );

      }
    );


  } catch (error) {

    console.error(error);

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
                data.estado || "pendiente"
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

    console.error(error);

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

    const counter = {};


    copies.forEach(
      item => {

        const data =
          item.data();


        const code =
          codeUpper(
            data.codigo
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
        (a,b) =>
          b[1] - a[1]
      )[0];


    if (topCoupon) {

      setText(
        "#topCoupon",
        `${topCoupon[0]} · ${topCoupon[1]} copias`
      );

    }


  } catch (error) {

    console.error(
      "Estadísticas:",
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
      error =>
        console.error(
          collectionName,
          error
        )
    );

  } catch (error) {

    console.error(error);

  }

}


/* =========================================================
   ESCUCHAR CAMBIOS
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
