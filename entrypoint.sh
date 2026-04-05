#!/bin/sh
# =====================================================
# entrypoint.sh — Inyecta variables de entorno en env.js
# Se ejecuta al iniciar el contenedor Docker.
# =====================================================

# La variable API_URL se define en el docker-compose.yml o en el comando `docker run`
# Si no está definida, usa el backend en localhost como fallback.
API_URL="${API_URL:-http://localhost:8080}"

echo "⚙️  Configurando entorno de producción..."
echo "   API_URL = $API_URL"

# Sobrescribir env.js con los valores reales del entorno
cat <<EOF > /usr/share/nginx/html/env.js
(function (window) {
  window['__env'] = window['__env'] || {};
  window['__env']['apiUrl'] = '${API_URL}';
})(this);
EOF

echo "✅ env.js generado correctamente."
echo "🚀 Iniciando Nginx..."

# Iniciar Nginx en foreground (requerido por Docker)
exec nginx -g 'daemon off;'
