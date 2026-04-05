// scripts/set-env.js
// ===========================================================
// Genera src/environments/environment.prod.ts dinámicamente
// usando variables de entorno disponibles en tiempo de BUILD.
//
// En Vercel: configura API_URL en el dashboard de Variables de Entorno.
// En local:  ejecuta `API_URL=http://localhost:8080 node scripts/set-env.js`
// ===========================================================

const fs = require('fs');
const path = require('path');

// Leer la variable de entorno → falla si no está definida en producción
const apiUrl = process.env.API_URL;

if (!apiUrl) {
  console.error('❌ ERROR: La variable de entorno API_URL no está definida.');
  console.error('   En Vercel: Agrega API_URL en Settings > Environment Variables');
  console.error('   En local:  Ejecuta: API_URL=http://localhost:8080 node scripts/set-env.js');
  process.exit(1); // Fallar el build intencionalmente
}

const content = `// ⚠️  ARCHIVO GENERADO AUTOMÁTICAMENTE — NO EDITAR MANUALMENTE
// Generado por scripts/set-env.js durante el build.
// La URL de la API se inyecta desde la variable de entorno API_URL.
export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

const outputPath = path.resolve(__dirname, '../src/environments/environment.prod.ts');
fs.writeFileSync(outputPath, content);

console.log('✅ environment.prod.ts generado correctamente.');
console.log(\`   apiUrl = \${apiUrl}\`);
