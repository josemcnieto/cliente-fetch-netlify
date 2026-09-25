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

    lista.innerHTML = libros
      .map(function (libro) {
        return '<li>' + libro.titulo + ' — ' + libro.autor + '</li>';
      })
      .join('');
  })
  .catch(function (error) {
    console.error('Falló el fetch:', error);
  });
