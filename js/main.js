const API = 'https://server-express-render.onrender.com';

const estado = document.getElementById('estado');
const mensaje = document.getElementById('mensaje');
const lista = document.getElementById('lista-libros');

const detalle = document.getElementById('detalle');
const detalleEstado = document.getElementById('detalle-estado');
const detalleContenido = document.getElementById('detalle-contenido');
const detalleCampos = {
  titulo: document.getElementById('detalle-titulo'),
  autor: document.getElementById('detalle-autor'),
  editorial: document.getElementById('detalle-editorial'),
  anio: document.getElementById('detalle-anio')
};

const formulario = document.getElementById('form-buscar');
// El id del input es "buscar-anio" (sin enie), pero la clave que usa la API es
// "año" (con enie). Son dos cosas distintas y se mantienen separadas a proposito:
// al leer hay que escribir camposFormulario['año'], no camposFormulario.anio.
const camposFormulario = {
  q: document.getElementById('buscar-q'),
  autor: document.getElementById('buscar-autor'),
  editorial: document.getElementById('buscar-editorial'),
  'año': document.getElementById('buscar-anio'),
  limit: document.getElementById('buscar-limit')
};

// Un mismo helper para los dos paneles. Si el texto llega vacio, lo oculta.
// El parametro se llama "texto" y no "mensaje" a proposito: si se llamara
// igual que la constante de arriba, dentro de esta funcion "mensaje" seria el
// parametro y no el elemento del DOM, y el bug pasaria desapercibido.
function mostrarEstado(elemento, texto, esError) {
  elemento.textContent = texto;
  elemento.classList.toggle('estado--error', Boolean(esError));
  elemento.hidden = !texto;
}

// Este va aparte de #estado a proposito. #estado lleva un girador en todo lo que
// no sea error, asi que jamas debe mostrar un texto de exito: "3 libros"
// dentro de #estado saldria con un spinner girando al lado. Aqui va solo la
// pista inicial y el numero de resultados, nunca carga ni error.
function mostrarMensaje(texto) {
  mensaje.textContent = texto;
  mensaje.hidden = !texto;
}

// El fetch NO entrega los datos: entrega una promesa que se resuelve con un objeto
// "Response". Los datos de verdad vienen en el siguiente then, tras el .json().

function pintarLibros(libros) {
  // .map() devuelve un ARRAY de strings, uno por libro. Al meterlo en innerHTML
  // se veria como "uno,dos,tres", por eso el .join('') los pega sin separador.
  // Cada card es un <button>, y no un <div> con onclick: asi el teclado
  // (Tab y Enter) ya funciona sin escribir nada de JavaScript.
  lista.innerHTML = libros
    .map(function (libro) {
      // Backticks permiten multilinea y ${} para interpolar variables.
      // Ojo: el campo se llama anioPublicacion con eñe, y en JavaScript
      // libro.añoPublicacion es un acceso valido a esa propiedad.
      // Dato clave: data-id guarda el id para poder pedir el detalle luego.
      return `
        <li class="item">
          <button type="button" class="card" data-id="${libro.id}">
            <span class="card__titulo">${libro.titulo}</span>
            <span class="card__autor">${libro.autor}</span>
            <span class="card__datos">${libro.editorial} · ${libro.añoPublicacion}</span>
          </button>
        </li>
      `;
    })
    .join('');

  // Los botones solo existen en el DOM DESPUES de escribir el innerHTML,
  // asi que aqui (no antes) se pueden enganchar los clics.
  lista.querySelectorAll('.card').forEach(function (tarjeta) {
    tarjeta.addEventListener('click', function () {
      // dataset.id lee el atributo data-id del HTML
      cargarDetalle(tarjeta.dataset.id);
    });
  });
}

// Una peticion por busqueda: si el usuario lanza dos seguidas, solo se pinta
// la ultima, porque las respuestas pueden llegar desordenadas.
let ultimaBusqueda = 0;

function cargarLista(url, mensajeCarga) {
  const busqueda = ++ultimaBusqueda;

  mostrarEstado(estado, mensajeCarga, false);

  // Mientras espera la respuesta no tiene sentido dejar el contador de la
  // busqueda anterior: si no, se veria "3 libros" junto al spinner.
  mostrarMensaje('');

  return fetch(url)
    .then(function (respuesta) {
      console.log('Primer then -> es un Response:', respuesta);

      // Trampa importante: fetch NO entra al catch cuando el servidor
      // responde 404 o 500. Solo se rechaza si se rompe la red. Por eso
      // hay que mirar .ok a mano y tirar el error uno mismo.
      if (!respuesta.ok) {
        throw new Error('el servidor respondio ' + respuesta.status);
      }

      return respuesta.json();
    })
    // Este then ya recibe el array de libros, porque .json() devuelve otra promesa.
    .then(function (libros) {
      if (busqueda !== ultimaBusqueda) return;

      // Un [] aqui no es un error: la API respondio bien, simplemente no
      // hubo coincidencias. Hay que distinguirlo del catch.
      if (libros.length === 0) {
        lista.innerHTML = '';
        mostrarMensaje('');   // el texto de "sin coincidencias" lo pone #estado
        mostrarEstado(estado, 'Ningun libro coincide con esos filtros.', true);
        return;
      }

      console.log('Segundo then -> son los datos:', libros);

      pintarLibros(libros);
      mostrarEstado(estado, '', false);

      // El plural va aparte porque "1 libros encontrados" se lee mal.
      mostrarMensaje(libros.length + (libros.length === 1 ? ' libro encontrado' : ' libros encontrados'));
    })
    .catch(function (error) {
      if (busqueda !== ultimaBusqueda) return;

      console.error('Falló el fetch:', error);

      lista.innerHTML = '';
      mostrarMensaje('');
      mostrarEstado(estado, 'No se pudieron cargar los libros: ' + error.message, true);
    });
}

// Cada clic en una card genera un numero. Si pulsas dos cards seguidas muy
// rapido, sus respuestas pueden llegar en orden distinto del que pediste:
// solo pintamos la ultima, y las viejas se descartan al notar que ya no mandan.
let ultimaPeticion = 0;

function cargarDetalle(id) {
  const peticion = ++ultimaPeticion;

  // showModal() en vez de quitar el atributo hidden. El panel antes era un
  // <aside> al final de la pagina, asi que se abria 1300px mas abajo, fuera de
  // la pantalla, y parecia que el clic no hacia nada. Como modal sale encima de
  // todo, y de regalo se cierra con la tecla Escape.
  if (!detalle.open) detalle.showModal();

  detalleContenido.hidden = true;
  mostrarEstado(detalleEstado, 'Cargando libro...', false);

  // encodeURIComponent por si el id trajera espacios o caracteres raros.
  return fetch(API + '/libros/' + encodeURIComponent(id))
    .then(function (respuesta) {
      if (!respuesta.ok) {
        throw new Error('el servidor respondio ' + respuesta.status);
      }
      return respuesta.json();
    })
    .then(function (libro) {
      // Llego una respuesta vieja: hay otra mas nueva en camino, se ignora.
      if (peticion !== ultimaPeticion) return;

      // Aqui se usa textContent y no innerHTML porque son campos sueltos:
      // es mas comodo y ademas textContent no interpreta HTML, asi que un
      // titulo con <b> dentro se veria literal en vez de ejecutarse.
      detalleCampos.titulo.textContent = libro.titulo;
      detalleCampos.autor.textContent = libro.autor;
      detalleCampos.editorial.textContent = libro.editorial;
      detalleCampos.anio.textContent = libro.añoPublicacion;

      detalleContenido.hidden = false;
      mostrarEstado(detalleEstado, '', false);
    })
    .catch(function (error) {
      if (peticion !== ultimaPeticion) return;

      mostrarEstado(detalleEstado, 'No se pudo cargar el libro: ' + error.message, true);
    });
}

function buscar(evento) {
  // Sin esto el navegador recarga la pagina y se lleva por delante los resultados.
  evento.preventDefault();

  const valores = {
    q: camposFormulario.q.value.trim(),
    autor: camposFormulario.autor.value.trim(),
    editorial: camposFormulario.editorial.value.trim(),
    'año': camposFormulario['año'].value.trim(),
    limit: camposFormulario.limit.value.trim()
  };

  // El servidor trata limit=0 como "cero resultados" y un negativo como un fallo
  // suyo (devuelve los libros menos el ultimo). En la practica el atributo
  // min="1" del input ya lo frena antes: el navegador no dispara el submit y
  // enseña su propio aviso. Esta comprobacion es solo una red por si alguien
  // quita ese atributo mas adelante.
  if (valores.limit !== '') {
    const limite = Number(valores.limit);

    if (!Number.isInteger(limite) || limite < 1) {
      mostrarEstado(estado, 'El limite debe ser un numero entero de 1 en adelante.', true);
      return;
    }
  }

  // new URL() + searchParams arma el query string. Concatenarlo a mano
  // obligaria a acordarse de codificar los espacios y la enie del parametro "año":
  // searchParams lo hace solo, y por eso el filtro de año funciona.
  const url = new URL(API + '/libros/buscar');

  Object.keys(valores).forEach(function (nombre) {
    // Solo se mandan los campos que el usuario relleno. Vacios el servidor los
    // ignora, pero es mas limpio no ensuciar la URL con q=&autor=.
    if (valores[nombre] !== '') {
      url.searchParams.set(nombre, valores[nombre]);
    }
  });

  console.log('URL que se va a pedir:', url.toString());

  cargarLista(url.toString(), 'Buscando...');
}

formulario.addEventListener('submit', buscar);

// "Ver todos" hace las dos cosas: vaciar los filtros y volver a pedir todo.
// Un solo boton en lugar de un "Limpiar" y otro "Ver todos" que se pisen.
document.getElementById('ver-todos').addEventListener('click', function () {
  formulario.reset();
  cargarLista(API + '/libros', 'Cargando libros...');
});

document.getElementById('cerrar-detalle').addEventListener('click', function () {
  detalle.close();

  // Anular la peticion en vuelo: si el fetch ya salio, su respuesta ya no
  // debe pintarse porque el usuario cerro el panel.
  ultimaPeticion++;
});

// Aquí ya no se pide nada. Antes se cargaba la lista al abrir la pagina, y eso
// hacia que el buscador no se notara: la lista ya estaba ahi, y al buscar solo
// se reemplaba por otra lista sin ningun "antes" con el que comparar. Arranquando
// vacio, cada peticion sale de un clic del usuario y se ve que provoca.
