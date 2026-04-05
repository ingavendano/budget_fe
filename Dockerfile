# =====================================================
# Dockerfile — Angular Frontend (Multi-stage build)
# Etapa 1: Build con Node.js
# Etapa 2: Servir con Nginx + inyección de env vars
# =====================================================

# --- STAGE 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifiestos primero para aprovechar el cache de Docker
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copiar el resto del código y compilar para producción
COPY . .
RUN npm run build -- --configuration=production

# --- STAGE 2: Serve ---
FROM nginx:1.27-alpine

# Copiar el build de Angular al directorio de Nginx
COPY --from=builder /app/dist/budget_fe/browser /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el script de arranque que inyecta las variables de entorno
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

# El entrypoint reescribe env.js con las vars del contenedor, luego inicia Nginx
ENTRYPOINT ["/entrypoint.sh"]
