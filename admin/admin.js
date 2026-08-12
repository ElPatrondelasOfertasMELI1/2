/* ============================================================
   ADMIN PRO
   EL PATRÓN DE LAS OFERTAS
============================================================ */

const dbAdmin =
  firebase.firestore();

const auth =
  firebase.auth();

const DEFAULT_LINK =
  "https://meli.la/1mj3itE";


let editingId = null;
let editingType = null;


/* ============================================================
   AUTH
============================================================ */

auth.onAuthStateChanged(
  user => {

    const login =
      document.getElementById(
        "loginView"
      );

    const admin =
      document.getElementById(
        "adminView"
      );

    if (user) {

      login.classList.add(
        "hidden"
      );

      admin.classList.remove(
        "hidden"
      );

      cargarTodo();

    } else {

      login.classList.remove(
        "hidden"
      );

      admin.classList.add(
        "hidden"
      );

    }

  }
);


document
  .getElementById("loginForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const email =
        document.getElementById(
          "loginEmail"
        ).value;

      const password =
        document.getElementById(
          "loginPassword"
        ).value;

      const message =
        document.getElementById(
          "loginMessage"
        );

      try {

        await auth.signInWithEmailAndPassword(
          email,
          password
        );

        message.textContent = "";

      } catch (error) {

        console.error(error);

        message.textContent =
          "Correo o contraseña incorrectos.";

      }

    }
  );


document
  .getElementById("logoutButton")
  .addEventListener(
    "click",
    () => auth.signOut()
  );


/* ============================================================
   MODAL
============================================================ */

const modal =
  document.getElementById(
    "adminModal"
  );

const form =
  document.getElementById(
    "adminForm"
  );


document
  .getElementById(
    "closeAdminModal"
  )
  .addEventListener(
    "click",
    cerrarModal
  );


function abrirModal(
  title,
  type,
  data = {}
) {

  editingId =
    data.id || null;

  editingType =
    type;

  document.getElementById(
    "modalTitle"
  ).textContent =
    title;


  if (type === "oferta") {

    form.innerHTML = `

      <div class="form-group">

        <label>
          Título
        </label>

        <input
          id="fTitulo"
          required
          value="${esc(
            data.titulo || ""
          )}"
        >

      </div>


      <div class="form-group">

        <label>
          Precio antes
        </label>

        <input
          type="number"
          id="fPrecioAntes"
          value="${data.precioAntes || ""}"
        >

      </div>


      <div class="form-group">

        <label>
          Precio actual
        </label>

        <input
          type="number"
          id="fPrecioActual"
          value="${data.precioActual || ""}"
        >

      </div>


      <div class="form-group">

        <label>
          Imagen
        </label>

        <input
          type="file"
          id="fImagen"
          accept="image/*"
        >

        ${
          data.imagen
            ? `
              <img
                class="image-preview"
                src="${data.imagen}"
              >
            `
            : ""
        }

      </div>


      <div class="form-group">

        <label>
          Enlace
        </label>

        <input
          id="fLink"
          value="${esc(
            data.link || DEFAULT_LINK
          )}"
        >

      </div>


      <div class="form-group">

        <label>
          Publicado
        </label>

        <select id="fPublicado">

          <option
            value="true"
            ${
              data.publicado !== false
                ? "selected"
                : ""
            }
          >
            Sí
          </option>

          <option
            value="false"
            ${
              data.publicado === false
                ? "selected"
                : ""
            }
          >
            No
          </option>

        </select>

      </div>


      <button class="form-submit">
        GUARDAR OFERTA
      </button>

    `;

  }


  if (type === "categoria") {

    form.innerHTML = `

      <div class="form-group">

        <label>
          Nombre
        </label>

        <input
          id="fNombre"
          required
          value="${esc(
            data.nombre || ""
          )}"
        >

      </div>


      <div class="form-group">

        <label>
          Ícono / emoji
        </label>

        <input
          id="fIcono"
          value="${esc(
            data.icono || "🛍️"
          )}"
        >

      </div>


      <div class="form-group">

        <label>
          Imagen
        </label>

        <input
          type="file"
          id="fImagen"
          accept="image/*"
        >

      </div>


      <div class="form-group">

        <label>
          Link de Mercado Libre
        </label>

        <input
          id="fLink"
          value="${esc(
            data.link || DEFAULT_LINK
          )}"
        >

      </div>


      <div class="form-group">

        <label>
          Orden
        </label>

        <input
          type="number"
          id="fOrden"
          value="${data.orden || 0}"
        >

      </div>


      <div class="form-group">

        <label>
          Publicado
        </label>

        <select id="fPublicado">

          <option
            value="true"
            ${
              data.publicado !== false
                ? "selected"
                : ""
            }
          >
            Sí
          </option>

          <option
            value="false"
            ${
              data.publicado === false
                ? ""
                : ""
            }
          >
            No
          </option>

        </select>

      </div>


      <button class="form-submit">
        GUARDAR CATEGORÍA
      </button>

    `;

  }


  if (type === "cupon") {

    form.innerHTML = `

      <div class="form-group">

        <label>
          Tipo de cupón
        </label>

        <select
          id="fTipo"
          required
        >

          <option
            value="relampago"
            ${
              data.tipo === "relampago"
                ? "selected"
                : ""
            }
          >
            ⚡ Cupón Relámpago
          </option>

          <option
            value="exclusivo"
            ${
              data.tipo === "exclusivo"
                ? "selected"
                : ""
            }
          >
            🏆 Cupón Exclusivo
          </option>

          <option
            value="bancario"
            ${
              data.tipo === "bancario"
                ? "selected"
                : ""
            }
          >
            🏦 Cupón Bancario
          </option>

        </select>

      </div>


      <div class="form-group">

        <label>
          Nombre / descuento
        </label>

        <input
          id="fNombre"
          required
          placeholder="Ejemplo: $500 OFF"
          value="${esc(
            data.nombre || ""
          )}"
        >

      </div>


      <div class="form-group">

        <label>
          Código del cupón
        </label>

        <input
          id="fCodigo"
          required
          placeholder="MELI14"
          value="${esc(
            String(
              data.codigo || ""
            ).toUpperCase()
          )}"
        >

      </div>


      <div class="form-group">

        <label>
          Compra mínima
        </label>

        <input
          type="number"
          id="fMinimo"
          value="${data.minimo || ""}"
        >

      </div>


      <div class="form-group">

        <label>
          Tope de descuento
        </label>

        <input
          type="number"
          id="fTope"
          value="${data.tope || ""}"
        >

      </div>


      <div class="form-group">

        <label>
          Enlace 1
        </label>

        <input
          id="fLink1"
          value="${esc(
            data.link1 ||
            DEFAULT_LINK
          )}"
        >

      </div>


      <div class="form-group">

        <label>
          Enlace 2
        </label>

        <input
          id="fLink2"
          value="${esc(
            data.link2 ||
            DEFAULT_LINK
          )}"
        >

      </div>


      <div class="form-group">

        <label>
          Estado
        </label>

        <select id="fEstado">

          <option
            value="activo"
            ${
              data.estado === "activo"
                ? "selected"
                : ""
            }
          >
            🟢 ACTIVO
          </option>

          <option
            value="por_agotarse"
            ${
              data.estado === "por_agotarse"
                ? "selected"
                : ""
            }
          >
            🟠 POR AGOTARSE
          </option>

          <option
            value="agotado"
            ${
              data.estado === "agotado"
                ? "selected"
                : ""
            }
          >
            🔴 AGOTADO
          </option>

        </select>

      </div>


      <div class="form-group">

        <label>
          Publicado
        </label>

        <select id="fPublicado">

          <option
            value="true"
            ${
              data.publicado !== false
                ? "selected"
                : ""
            }
          >
            Sí
          </option>

          <option
            value="false"
            ${
              data.publicado === false
                ? "selected"
                : ""
            }
          >
            No
          </option>

        </select>

      </div>


      <button class="form-submit">
        GUARDAR CUPÓN
      </button>

    `;

  }


  modal.classList.add(
    "show"
  );

}


function cerrarModal() {

  modal.classList.remove(
    "show"
  );

  form.innerHTML = "";

  editingId = null;
  editingType = null;

}


/* ============================================================
   BASE64
============================================================ */

function fileToBase64(file) {

  if (!file) {
    return Promise.resolve("");
  }

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


/* ============================================================
   GUARDAR
============================================================ */

form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    try {

      if (
        editingType ===
        "oferta"
      ) {

        await guardarOferta();

      }

      if (
        editingType ===
        "categoria"
      ) {

        await guardarCategoria();

      }

      if (
        editingType ===
        "cupon"
      ) {

        await guardarCupon();

      }

      cerrarModal();

    } catch (error) {

      console.error(error);

      alert(
        "Ocurrió un error al guardar."
      );

    }

  }
);


async function guardarOferta() {

  const imagenFile =
    document.getElementById(
      "fImagen"
    ).files[0];

  let imagen =
    "";

  if (imagenFile) {

    imagen =
      await fileToBase64(
        imagenFile
      );

  }


  const data = {

    titulo:
      document.getElementById(
        "fTitulo"
      ).value.trim(),

    precioAntes:
      Number(
        document.getElementById(
          "fPrecioAntes"
        ).value || 0
      ),

    precioActual:
      Number(
        document.getElementById(
          "fPrecioActual"
        ).value || 0
      ),

    link:
      document.getElementById(
        "fLink"
      ).value.trim(),

    publicado:
      document.getElementById(
        "fPublicado"
      ).value === "true",

    actualizado:
      firebase.firestore.FieldValue.serverTimestamp()

  };


  if (imagen) {

    data.imagen =
      imagen;

  }


  if (editingId) {

    await dbAdmin
      .collection("ofertas")
      .doc(editingId)
      .update(data);

  } else {

    data.creado =
      firebase.firestore.FieldValue.serverTimestamp();

    await dbAdmin
      .collection("ofertas")
      .add(data);

  }

}


async function guardarCategoria() {

  const imagenFile =
    document.getElementById(
      "fImagen"
    ).files[0];

  let imagen =
    "";

  if (imagenFile) {

    imagen =
      await fileToBase64(
        imagenFile
      );

  }


  const data = {

    nombre:
      document.getElementById(
        "fNombre"
      ).value.trim(),

    icono:
      document.getElementById(
        "fIcono"
      ).value.trim(),

    link:
      document.getElementById(
        "fLink"
      ).value.trim(),

    orden:
      Number(
        document.getElementById(
          "fOrden"
        ).value || 0
      ),

    publicado:
      document.getElementById(
        "fPublicado"
      ).value === "true",

    actualizado:
      firebase.firestore.FieldValue.serverTimestamp()

  };


  if (imagen) {

    data.imagen =
      imagen;

  }


  if (editingId) {

    await dbAdmin
      .collection("categorias")
      .doc(editingId)
      .update(data);

  } else {

    await dbAdmin
      .collection("categorias")
      .add(data);

  }

}


async function guardarCupon() {

  const codigo =
    document.getElementById(
      "fCodigo"
    ).value
      .trim()
      .toUpperCase();


  const data = {

    tipo:
      document.getElementById(
        "fTipo"
      ).value,

    nombre:
      document.getElementById(
        "fNombre"
      ).value.trim(),

    codigo,

    minimo:
      Number(
        document.getElementById(
          "fMinimo"
        ).value || 0
      ),

    tope:
      Number(
        document.getElementById(
          "fTope"
        ).value || 0
      ),

    link1:
      document.getElementById(
        "fLink1"
      ).value.trim() ||
      DEFAULT_LINK,

    link2:
      document.getElementById(
        "fLink2"
      ).value.trim() ||
      DEFAULT_LINK,

    estado:
      document.getElementById(
        "fEstado"
      ).value,

    publicado:
      document.getElementById(
        "fPublicado"
      ).value === "true",

    actualizado:
      firebase.firestore.FieldValue.serverTimestamp()

  };


  if (editingId) {

    await dbAdmin
      .collection("cupones")
      .doc(editingId)
      .update(data);

  } else {

    data.creado =
      firebase.firestore.FieldValue.serverTimestamp();

    await dbAdmin
      .collection("cupones")
      .add(data);

  }

}


/* ============================================================
   LISTAS
============================================================ */

function esc(value = "") {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function cargarTodo() {

  cargarOfertasAdmin();

  cargarCategoriasAdmin();

  cargarCuponesAdmin();

  cargarUsuariosAdmin();

  cargarEstadisticas();

}


/* ============================================================
   OFERTAS ADMIN
============================================================ */

function cargarOfertasAdmin() {

  dbAdmin.collection("ofertas")
    .orderBy(
      "actualizado",
      "desc"
    )
    .onSnapshot(
      snapshot => {

        const list =
          document.getElementById(
            "offersList"
          );

        list.innerHTML = "";

        snapshot.forEach(
          doc => {

            const data =
              doc.data();

            const item =
              document.createElement(
                "div"
              );

            item.className =
              "admin-item";

            item.innerHTML = `

              ${
                data.imagen
                  ? `
                    <img
                      src="${data.imagen}"
                    >
                  `
                  : ""
              }

              <div class="admin-item-main">

                <strong>
                  ${esc(
                    data.titulo ||
                    "Oferta"
                  )}
                </strong>

                <small>
                  ${data.precioActual
                    ? `

                      ${Number(
                        data.precioActual
                      ).toLocaleString(
                        "es-MX",
                        {
                          style: "currency",
                          currency: "MXN"
                        }
                      )}

                    `
                    : ""
                  }

                  ·

                  ${
                    data.publicado
                      ? "PUBLICADA"
                      : "OCULTA"
                  }

                </small>

              </div>

              <div class="admin-actions">

                <button
                  class="edit"
                  data-id="${doc.id}"
                >
                  EDITAR
                </button>

                <button
                  class="delete"
                  data-id="${doc.id}"
                >
                  BORRAR
                </button>

              </div>

            `;

            item
              .querySelector(
                ".edit"
              )
              .onclick =
              () =>
                abrirModal(
                  "Editar oferta",
                  "oferta",
                  {
                    id: doc.id,
                    ...data
                  }
                );


            item
              .querySelector(
                ".delete"
              )
              .onclick =
              () =>
                borrar(
                  "ofertas",
                  doc.id
                );


            list.appendChild(item);

          }
        );

      }
    );

}


/* ============================================================
   CATEGORÍAS ADMIN
============================================================ */

function cargarCategoriasAdmin() {

  dbAdmin.collection(
    "categorias"
  )
  .orderBy(
    "orden",
    "asc"
  )
  .onSnapshot(
    snapshot => {

      const list =
        document.getElementById(
          "categoriesList"
        );

      list.innerHTML = "";

      snapshot.forEach(
        doc => {

          const data =
            doc.data();

          const item =
            document.createElement(
              "div"
            );

          item.className =
            "admin-item";

          item.innerHTML = `

            ${
              data.imagen
                ? `
                  <img
                    src="${data.imagen}"
                  >
                `
                : `
                  <div
                    style="
                    font-size:30px;
                    width:60px;
                    text-align:center;
                    "
                  >
                    ${data.icono || "🛍️"}
                  </div>
                `
            }

            <div class="admin-item-main">

              <strong>
                ${esc(
                  data.nombre ||
                  "Categoría"
                )}
              </strong>

              <small>
                Orden:
                ${data.orden || 0}
                ·
                ${
                  data.publicado
                    ? "PUBLICADA"
                    : "OCULTA"
                }
              </small>

            </div>

            <div class="admin-actions">

              <button
                class="edit"
              >
                EDITAR
              </button>

              <button
                class="delete"
              >
                BORRAR
              </button>

            </div>

          `;


          item
            .querySelector(".edit")
            .onclick =
            () =>
              abrirModal(
                "Editar categoría",
                "categoria",
                {
                  id: doc.id,
                  ...data
                }
              );


          item
            .querySelector(".delete")
            .onclick =
            () =>
              borrar(
                "categorias",
                doc.id
              );


          list.appendChild(item);

        }
      );

    }
  );

}


/* ============================================================
   CUPONES ADMIN
============================================================ */

function cargarCuponesAdmin() {

  dbAdmin.collection(
    "cupones"
  )
  .onSnapshot(
    snapshot => {

      const list =
        document.getElementById(
          "couponsList"
        );

      list.innerHTML = "";


      const docs =
        snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .sort(
            (a,b) =>
              Number(a.minimo || 0) -
              Number(b.minimo || 0)
          );


      docs.forEach(
        data => {

          const item =
            document.createElement(
              "div"
            );

          item.className =
            "admin-item";


          item.innerHTML = `

            <div class="admin-item-main">

              <strong>
                ${esc(
                  String(
                    data.codigo || ""
                  ).toUpperCase()
                )}
              </strong>

              <small>

                ${esc(
                  data.nombre ||
                  ""
                )}

                ·

                ${
                  data.tipo ||
                  ""
                }

                ·

                Mínimo:
                $
                ${Number(
                  data.minimo || 0
                ).toLocaleString(
                  "es-MX"
                )}

                ·

                ${
                  data.publicado
                    ? "PUBLICADO"
                    : "OCULTO"
                }

              </small>

            </div>


            <div class="admin-actions">

              <button
                class="edit"
              >
                EDITAR
              </button>

              <button
                class="delete"
              >
                BORRAR
              </button>

            </div>

          `;


          item
            .querySelector(".edit")
            .onclick =
            () =>
              abrirModal(
                "Editar cupón",
                "cupon",
                data
              );


          item
            .querySelector(".delete")
            .onclick =
            () =>
              borrar(
                "cupones",
                data.id
              );


          list.appendChild(item);

        }
      );

    }
  );

}


/* ============================================================
   USUARIOS
============================================================ */

function cargarUsuariosAdmin() {

  dbAdmin.collection(
    "usuarios"
  )
  .orderBy(
    "fecha",
    "desc"
  )
  .onSnapshot(
    snapshot => {

      const list =
        document.getElementById(
          "usersList"
        );

      list.innerHTML = "";


      snapshot.forEach(
        doc => {

          const data =
            doc.data();

          const item =
            document.createElement(
              "div"
            );

          item.className =
            "admin-item";


          item.innerHTML = `

            ${
              data.fotoBase64
                ? `
                  <img
                    src="${data.fotoBase64}"
                  >
                `
                : ""
            }


            <div class="admin-item-main">

              <strong>
                ${esc(
                  data.nombre ||
                  "Usuario"
                )}
              </strong>

              <small>

                ${esc(
                  data.correo ||
                  ""
                )}

                ·

                ${esc(
                  data.telefono ||
                  ""
                )}

                ·

                Cupón:
                ${esc(
                  data.cuponUtilizado ||
                  "—"
                )}

                ·

                Estado:
                ${
                  data.confirmado
                    ? "✓ CONFIRMADO"
                    : "⏳ PENDIENTE"
                }

              </small>

            </div>


            <div class="admin-actions">

              <button
                class="edit"
                onclick="confirmarUsuario('${doc.id}')"
              >
                CONFIRMAR
              </button>

            </div>

          `;


          list.appendChild(item);

        }
      );

    }
  );

}


async function confirmarUsuario(id) {

  await dbAdmin
    .collection("usuarios")
    .doc(id)
    .update({

      confirmado: true,

      estado: "confirmado",

      confirmadoEn:
        firebase.firestore.FieldValue.serverTimestamp()

    });

}


/* ============================================================
   BORRAR
============================================================ */

async function borrar(
  collection,
  id
) {

  if (
    !confirm(
      "¿Seguro que quieres borrar este registro?"
    )
  ) {

    return;

  }


  await dbAdmin
    .collection(collection)
    .doc(id)
    .delete();

}


/* ============================================================
   BOTONES
============================================================ */

document
  .getElementById(
    "newOfferButton"
  )
  .onclick =
  () =>
    abrirModal(
      "Nueva oferta",
      "oferta"
    );


document
  .getElementById(
    "newCategoryButton"
  )
  .onclick =
  () =>
    abrirModal(
      "Nueva categoría",
      "categoria"
    );


document
  .getElementById(
    "newCouponButton"
  )
  .onclick =
  () =>
    abrirModal(
      "Nuevo cupón",
      "cupon"
    );


/* ============================================================
   ESTADÍSTICAS
============================================================ */

async function cargarEstadisticas() {

  const hoy =
    new Date()
      .toISOString()
      .slice(0, 10);


  try {

    const hoyDoc =
      await dbAdmin
        .collection(
          "estadisticas_diarias"
        )
        .doc(hoy)
        .get();


    document.getElementById(
      "statUsuariosHoy"
    ).textContent =
      hoyDoc.exists
        ? Number(
            hoyDoc.data().usuarios || 0
          )
        : 0;


    const usuarios =
      await dbAdmin
        .collection(
          "usuarios"
        )
        .get();


    document.getElementById(
      "statUsuarios"
    ).textContent =
      usuarios.size;


    const copias =
      await dbAdmin
        .collection(
          "copias"
        )
        .get();


    let total = 0;

    let topCodigo = "—";
    let topCopias = 0;


    copias.forEach(
      doc => {

        const data =
          doc.data();

        const cantidad =
          Number(
            data.copias || 0
          );

        total += cantidad;

        if (
          cantidad >
          topCopias
        ) {

          topCopias =
            cantidad;

          topCodigo =
            data.codigo ||
            doc.id;

        }

      }
    );


    document.getElementById(
      "statCopias"
    ).textContent =
      total;


    document.getElementById(
      "statTopCupon"
    ).textContent =
      topCodigo;


    crearGraficaUsuarios();

    crearGraficaCopias(
      copias
    );

  } catch (error) {

    console.error(
      "Estadísticas:",
      error
    );

  }

}


/* ============================================================
   GRÁFICAS
============================================================ */

let usuariosChart;
let copiasChart;


async function cargarDias() {

  const snapshot =
    await dbAdmin
      .collection(
        "estadisticas_diarias"
      )
      .orderBy(
        "fecha",
        "asc"
      )
      .limit(30)
      .get();

  return snapshot.docs.map(
    doc => {

      const data =
        doc.data();

      return {

        fecha:
          data.fecha ||
          doc.id,

        usuarios:
          Number(
            data.usuarios || 0
          )

      };

    }
  );

}


async function crearGraficaUsuarios() {

  const canvas =
    document.getElementById(
      "usuariosChart"
    );

  if (
    typeof Chart ===
    "undefined"
  ) {

    cargarChartJS();

    setTimeout(
      crearGraficaUsuarios,
      1000
    );

    return;

  }


  const datos =
    await cargarDias();


  const labels =
    datos.map(
      d => d.fecha
    );

  const values =
    datos.map(
      d => d.usuarios
    );


  if (usuariosChart) {

    usuariosChart.destroy();

  }


  usuariosChart =
    new Chart(
      canvas,
      {
        type: "line",

        data: {

          labels,

          datasets: [

            {
              label:
                "Usuarios únicos",

              data:
                values,

              tension:
                .3

            }

          ]

        },

        options: {

          responsive: true,

          plugins: {
            legend: {
              display: false
            }
          }

        }

      }
    );

}


function crearGraficaCopias(
  snapshot
) {

  if (
    typeof Chart ===
    "undefined"
  ) {

    cargarChartJS();

    setTimeout(
      () =>
        crearGraficaCopias(
          snapshot
        ),
      1000
    );

    return;

  }


  const docs =
    snapshot.docs
      .map(
        doc => {

          const data =
            doc.data();

          return {

            codigo:
              data.codigo ||
              doc.id,

            copias:
              Number(
                data.copias || 0
              )

          };

        }
      )
      .sort(
        (a,b) =>
          b.copias -
          a.copias
      )
      .slice(
        0,
        10
      );


  const labels =
    docs.map(
      d => d.codigo
    );

  const values =
    docs.map(
      d => d.copias
    );


  const canvas =
    document.getElementById(
      "copiasChart"
    );


  if (copiasChart) {

    copiasChart.destroy();

  }


  copiasChart =
    new Chart(
      canvas,
      {

        type: "bar",

        data: {

          labels,

          datasets: [

            {
              label:
                "Copias",

              data:
                values

            }

          ]

        },

        options: {

          responsive: true,

          plugins: {

            legend: {
              display: false
            }

          }

        }

      }
    );

}


function cargarChartJS() {

  if (
    document.getElementById(
      "chartJs"
    )
  ) {

    return;

  }


  const script =
    document.createElement(
      "script"
    );

  script.id =
    "chartJs";

  script.src =
    "https://cdn.jsdelivr.net/npm/chart.js";

  document.head.appendChild(
    script
  );

}