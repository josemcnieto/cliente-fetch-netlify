const API = 'https://server-express-render.onrender.com';

const estado = document.getElementById('estado');
const lista = document.getElementById('lista-libros');

// Un solo elemento para los tres estados posibles: cargando, error y "todo bien"
// (que se esconde con hidden). Asi no hay varios <p> que mostrar y ocultar.
function mostrarEstado(mensaje, esError) {
  estado.textContent = mensaje;
  estado.classList.toggle('estado--error', Boolean(esError));
  estado.hidden = !mensaje;
}

function cargarLibros() {
  // Render en plan gratuito se duerme: la primera peticion puede tardar 30-60s.
  // Sin este aviso el usuario solo ve una pagina vacia y no sabe que pasa.
  mostrarEstado('Cargando libros...', false);

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
      lista.innerHTML = libros
        .map(function (libro) {
          // Backticks permiten multilinea y ${} para interpolar variables.
          // Ojo: el campo se llama anioPublicacion con eñe, y en JavaScript
          // libro.añoPublicacion es un acceso valido a esa propiedad.
          return `
            <li class="card">
              <h2 class="card__titulo">${libro.titulo}</h2>
              <p class="card__autor">${libro.autor}</p>
              <p class="card__datos">${libro.editorial} · ${libro.añoPublicacion}</p>
            </li>
          `;
        })
        .join('');

      mostrarEstado('', false);
    })
    .catch(function (error) {
      console.error('Falló el fetch:', error);

      lista.innerHTML = '';
      mostrarEstado('No se pudieron cargar los libros: ' + error.message, true);
    });
}

cargarLibros();
