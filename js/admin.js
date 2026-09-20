import { db } from "./firebase.js";

import {
collection,
addDoc,
getDocs,
deleteDoc,
doc,
setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ======================================
   BASE64 + PREVIEW
====================================== */

async function convertirBase64(file){

return new Promise((resolve,reject)=>{

const reader = new FileReader();

reader.readAsDataURL(file);

reader.onload = () => resolve(reader.result);

reader.onerror = error => reject(error);

});

}

function preview(inputId,imgId){

const input =
document.getElementById(inputId);

const img =
document.getElementById(imgId);

if(!input || !img) return;

input.addEventListener("change",async()=>{

const file = input.files[0];

if(!file) return;

const base64 =
await convertirBase64(file);

img.src = base64;
img.style.display = "block";

});

}

preview("catImagen","catPreview");
preview("bannerImagen","bannerPreview");
preview("mpImagen","mpPreview");

/* ======================================
   CATEGORIAS
====================================== */

window.guardarCategoria = async()=>{

const nombre =
document.getElementById("catNombre").value;

const link =
document.getElementById("catLink").value;

const archivo =
document.getElementById("catImagen").files[0];

if(!nombre || !link || !archivo){

alert("Completa todos los campos");
return;

}

const imagen =
await convertirBase64(archivo);

await addDoc(
collection(db,"categorias"),
{
nombre,
link,
imagen,
clicks:0,
fecha:Date.now()
}
);

alert("Categoría guardada");

location.reload();

};

/* ======================================
   BANNERS
====================================== */

window.guardarBanner = async()=>{

const archivo =
document.getElementById("bannerImagen").files[0];

if(!archivo){
alert("Selecciona imagen");
return;
}

const imagen =
await convertirBase64(archivo);

await addDoc(
collection(db,"banners"),
{
imagen,

precioOriginal:
document.getElementById("bannerPrecioOriginal").value,

descuento:
document.getElementById("bannerDescuento").value,

precioFinal:
document.getElementById("bannerPrecioFinal").value,

link:
document.getElementById("bannerLink").value,

clicks:0,
fecha:Date.now()
}
);

alert("Banner guardado");

location.reload();

};

/* ======================================
   MERCADO PAGO
====================================== */

window.guardarMercadoPago = async()=>{

const archivo =
document.getElementById("mpImagen").files[0];

let imagen = "";

if(archivo){

imagen =
await convertirBase64(archivo);

}

await setDoc(
doc(db,"mercadoPago","principal"),
{

titulo:
document.getElementById("mpTitulo").value,

descripcion:
document.getElementById("mpDescripcion").value,

link:
document.getElementById("mpLink").value,

imagen,

clicks:0

}
);

alert("Mercado Pago actualizado");

};

/* ======================================
   RELAMPAGO
====================================== */

window.guardarRelampago = async()=>{

await addDoc(
collection(db,"cuponesRelampago"),
{

titulo:
document.getElementById("rTitulo").value,

codigo:
document.getElementById("rCodigo").value,

porcentaje:
document.getElementById("rPorcentaje").value,

minimo:
document.getElementById("rMinimo").value,

maximo:
document.getElementById("rMaximo").value,

link:
document.getElementById("rLink").value,

copias:0

}
);

alert("Cupón guardado");

location.reload();

};

/* ======================================
   TIENDAS
====================================== */

window.guardarTienda = async()=>{

await addDoc(
collection(db,"cuponesTiendas"),
{

titulo:
document.getElementById("tTitulo").value,

codigo:
document.getElementById("tCodigo").value,

porcentaje:
document.getElementById("tPorcentaje").value,

minimo:
document.getElementById("tMinimo").value,

maximo:
document.getElementById("tMaximo").value,

link:
document.getElementById("tLink").value,

copias:0

}
);

alert("Cupón guardado");

location.reload();

};

/* ======================================
   BANCARIOS
====================================== */

window.guardarBancario = async()=>{

await addDoc(
collection(db,"cuponesBancarios"),
{

titulo:
document.getElementById("bTitulo").value,

codigo:
document.getElementById("bCodigo").value,

porcentaje:
document.getElementById("bPorcentaje").value,

minimo:
document.getElementById("bMinimo").value,

maximo:
document.getElementById("bMaximo").value,

link:
document.getElementById("bLink").value,

copias:0

}
);

alert("Cupón guardado");

location.reload();

};

/* ======================================
   LISTADOS
====================================== */

async function listar(
coleccionNombre,
contenedorId
){

const contenedor =
document.getElementById(contenedorId);

if(!contenedor) return;

const datos =
await getDocs(
collection(db,coleccionNombre)
);

contenedor.innerHTML = "";

datos.forEach((item)=>{

const div =
document.createElement("div");

div.style.marginBottom="10px";

div.innerHTML = `
<b>${item.data().titulo || item.data().nombre}</b>
<br><br>
<button onclick="eliminarRegistro(
'${coleccionNombre}',
'${item.id}'
)">
Eliminar
</button>
<hr>
`;

contenedor.appendChild(div);

});

}

window.eliminarRegistro =
async(coleccionNombre,id)=>{

if(!confirm("Eliminar registro?"))
return;

await deleteDoc(
doc(db,coleccionNombre,id)
);

location.reload();

};

/* ======================================
   CARGAR
====================================== */

listar(
"categorias",
"listaCategorias"
);

listar(
"banners",
"listaBanners"
);

listar(
"cuponesRelampago",
"listaRelampago"
);

listar(
"cuponesTiendas",
"listaTiendas"
);

listar(
"cuponesBancarios",
"listaBancarios"
);