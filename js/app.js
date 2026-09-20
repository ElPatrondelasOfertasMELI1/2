import { db } from "./firebase.js";

import {
collection,
getDocs,
getDoc,
doc,
updateDoc,
increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ======================================
   CATEGORIAS
====================================== */

async function cargarCategorias(){

const contenedor =
document.getElementById("categorias");

if(!contenedor) return;

const datos =
await getDocs(
collection(db,"categorias")
);

contenedor.innerHTML = "";

datos.forEach((item)=>{

const data = item.data();

contenedor.innerHTML += `

<div
class="categoria"
onclick="abrirCategoria(
'${item.id}',
'${data.link}'
)">

<img src="${data.imagen}">

<span>
${data.nombre}
</span>

</div>

`;

});

}

/* ======================================
   BANNERS
====================================== */

async function cargarBanners(){

const contenedor =
document.getElementById("bannerCarousel");

if(!contenedor) return;

const datos =
await getDocs(
collection(db,"banners")
);

contenedor.innerHTML = "";

datos.forEach((item)=>{

const data = item.data();

contenedor.innerHTML += `

<div class="banner-card">

<img
src="${data.imagen}">

<div class="banner-info">

<div class="precio-anterior">
$${data.precioOriginal}
</div>

<div class="descuento">
${data.descuento}% OFF
</div>

<div class="precio-final">
$${data.precioFinal}
</div>

<button
class="btn-banner"
onclick="abrirBanner(
'${item.id}',
'${data.link}'
)">
VER OFERTA
</button>

</div>

</div>

`;

});

iniciarBannerAuto();

}

/* ======================================
   MERCADO PAGO
====================================== */

async function cargarMercadoPago(){

const contenedor =
document.getElementById(
"mercadoPagoCard"
);

if(!contenedor) return;

const documento =
await getDoc(
doc(
db,
"mercadoPago",
"principal"
)
);

if(!documento.exists())
return;

const data =
documento.data();

contenedor.innerHTML = `

<div
class="mp-card"
onclick="abrirMercadoPago(
'${data.link}'
)">

${data.imagen
? `<img src="${data.imagen}"
style="
width:100%;
border-radius:12px;
margin-bottom:10px;
">`
: ""}

<div class="mp-title">
${data.titulo}
</div>

<div class="mp-desc">
${data.descripcion}
</div>

</div>

`;

}

/* ======================================
   CUPONES
====================================== */

async function cargarCupones(
coleccionNombre,
contenedorId
){

const contenedor =
document.getElementById(
contenedorId
);

if(!contenedor) return;

const datos =
await getDocs(
collection(
db,
coleccionNombre
)
);

let html =
'<div class="cupones-scroll">';

datos.forEach((item)=>{

const data =
item.data();

html += `

<div class="cupon-card">

<div class="cupon-titulo">
${data.titulo}
</div>

<div class="cupon-descuento">
${data.porcentaje}% OFF
</div>

<div class="cupon-desc">
Compra mínima:
$${data.minimo}
</div>

<div class="cupon-desc">
Descuento máximo:
$${data.maximo}
</div>

<button
class="btn-cupon"
onclick="copiarCupon(
'${item.id}',
'${coleccionNombre}',
'${data.codigo}',
'${data.link}'
)">
COPIAR CUPÓN
</button>

</div>

`;

});

html += "</div>";

contenedor.innerHTML =
html;

}

/* ======================================
   CONTAR CLICK CATEGORIA
====================================== */

window.abrirCategoria =
async(id,link)=>{

try{

await updateDoc(
doc(
db,
"categorias",
id
),
{
clicks:
increment(1)
}
);

}catch(e){}

window.location.href =
link;

};

/* ======================================
   CONTAR CLICK BANNER
====================================== */

window.abrirBanner =
async(id,link)=>{

try{

await updateDoc(
doc(
db,
"banners",
id
),
{
clicks:
increment(1)
}
);

}catch(e){}

window.location.href =
link;

};

/* ======================================
   MERCADO PAGO
====================================== */

window.abrirMercadoPago =
(link)=>{

window.location.href =
link;

};

/* ======================================
   COPIAR CUPON
====================================== */

window.copiarCupon =
async(
id,
coleccionNombre,
codigo,
link
)=>{

try{

await navigator.clipboard
.writeText(codigo);

}catch(e){

alert(
"Copia manual: " +
codigo
);

}

const key =
"cupon_" + id;

const existe =
localStorage.getItem(
key
);

if(!existe){

try{

await updateDoc(
doc(
db,
coleccionNombre,
id
),
{
copias:
increment(1)
}
);

}catch(e){}

localStorage.setItem(
key,
"1"
);

}

window.location.href =
link;

};

/* ======================================
   BANNER AUTO
====================================== */

function iniciarBannerAuto(){

const carrusel =
document.getElementById(
"bannerCarousel"
);

if(!carrusel)
return;

let posicion = 0;

setInterval(()=>{

posicion += 340;

if(
posicion >
carrusel.scrollWidth
){

posicion = 0;

}

carrusel.scrollTo({

left: posicion,

behavior:"smooth"

});

},4000);

}

/* ======================================
   INICIO
====================================== */

cargarCategorias();

cargarBanners();

cargarMercadoPago();

cargarCupones(
"cuponesRelampago",
"relampagoContainer"
);

cargarCupones(
"cuponesTiendas",
"tiendasContainer"
);

cargarCupones(
"cuponesBancarios",
"bancariosContainer"
);