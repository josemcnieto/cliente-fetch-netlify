const API = 'https://server-express-render.onrender.com';

const estado = document.getElementById('estado');
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

// El fetch NO entrega los datos: entrega una promesa que se resuelve con un objeto
// "Response". Los datos de verdad vienen en el siguiente then, tras el .json().

// Un mismo helper para los dos paneles. Si el mensaje llega vacio, lo oculta.
function mostrarEstado(elemento, mensaje, esError) {
  elemento.textContent = mensaje;
  elemento.classList.toggle('estado--error', Boolean(esError));
  elemento.hidden = !mensaje;
}

function cargarLibros() {
  // Render en plan gratuito se duerme: la primera peticion puede tardar 30-60s.
  // Sin este aviso el usuario solo ve una pagina vacia y no sabe que pasa.
  mostrarEstado(estado, 'Cargando libros...', false);

  // El return es importante: permite encadenar .then mas adelante sobre la
  // promesa que devuelve esta funcion.
  return fetch(API + '/libros')
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
      console.log('Segundo then -> son los datos:', libros);

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

      mostrarEstado(estado, '', false);
    })
    .catch(function (error) {
      console.error('Falló el fetch:', error);

      lista.innerHTML = '';
      mostrarEstado(estado, 'No se pudieron cargar los libros: ' + error.message, true);
    });
}

// Cada clic en una card genera un numero. Si pulsas dos cards seguidas muy
// rapido, sus respuestas pueden llegar en orden distinto del que pediste:
// solo pintamos la ultima, y las viejas se descartan al notar que ya no mandan.
let ultimaPeticion = 0;

function cargarDetalle(id) {
  const peticion = ++ultimaPeticion;

  detalle.hidden = false;
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

document.getElementById('cerrar-detalle').addEventListener('click', function () {
  detalle.hidden = true;

  // Anular la peticion en vuelo: si el fetch ya salio, su respuesta ya no
  // debe pintarse porque el usuario cerro el panel.
  ultimaPeticion++;
});

cargarLibros();
