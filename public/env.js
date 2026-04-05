// env.js — Variables de entorno en RUNTIME para Angular SPA
// Este archivo es sobrescrito por el contenedor Docker al iniciar (docker-entrypoint.sh)
// NO incluir en .gitignore — el placeholder es seguro para versionar
(function (window) {
  window['__env'] = window['__env'] || {};

  // URL base de la API del backend
  // En producción, el entrypoint.sh de Docker reemplaza este valor
  // con la variable de entorno API_URL del contenedor.
  window['__env']['apiUrl'] = 'http://localhost:8080';
})(this);
