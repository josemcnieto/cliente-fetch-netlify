const API = 'https://server-express-render.onrender.com';

const lista = document.getElementById('lista-libros');

// El fetch NO entrega los datos: entrega una promesa que se resuelve con un objeto
// "Response". Los datos de verdad vienen en el siguiente then, tras el .json().
fetch(API + '/libros')
  .then(function (respuesta) {
    console.log('Primer then -> es un Response:', respuesta);
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
  })
  .catch(function (error) {
    console.error('Falló el fetch:', error);
  });
