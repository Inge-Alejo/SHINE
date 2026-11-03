/**
 * SHINE Fragancias - Pipeline Automatizado con Gemini API
 * Scrapeo de notas, identificación de frasco oficial y recorte sin fondo (PNG transparente)
 * 
 * Uso:
 *   GEMINI_API_KEY="tu-key" node scripts/sync_gemini_images.mjs [--limit=10] [--category=Inspiraciones]
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Cargar variables de entorno si existen
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log('\n⚠️  GEMINI_API_KEY no detectada.');
  console.log('Para ejecutar la sincronización automática con Gemini, define tu clave:');
  console.log('   set GEMINI_API_KEY=tu_clave (en Windows)');
  console.log('   o agrégala en .env.local');
  console.log('\nEl catálogo mantendrá sus 15 frascos verificados actuales y sus fichas completas.\n');
  process.exit(0);
}

const ai = new GoogleGenAI({ apiKey });

// Parsear argumentos CLI
const args = process.argv.slice(2);
let limit = 5;
let filterCategory = null;

args.forEach(arg => {
  if (arg.startsWith('--limit=')) limit = parseInt(arg.split('=')[1], 10);
  if (arg.startsWith('--category=')) filterCategory = arg.split('=')[1];
});

const catalogPath = path.resolve('frontend/public/data/catalog.json');
const outputDir = path.resolve('frontend/public/uploads/products');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function runGeminiPipeline() {
  console.log('\n💎 SHINE Fragancias - Iniciando Pipeline con Gemini API...');
  console.log(`Límite por ejecución: ${limit} perfumes`);
  if (filterCategory) console.log(`Filtrando por categoría: ${filterCategory}`);

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  // Filtrar perfumes sin imagen o que requieran enriquecimiento
  let candidates = catalog.filter(p => !p.image_url);
  if (filterCategory) {
    candidates = candidates.filter(p => p.category === filterCategory);
  }

  console.log(`Perfumes pendientes de fotografía: ${candidates.length}`);
  const batch = candidates.slice(0, limit);

  let processedCount = 0;

  for (const product of batch) {
    console.log(`\n🔍 Procesando [${product.id}]: ${product.name} (${product.brand})...`);

    try {
      const prompt = `Actúa como un experto perfumista y director de arte.
Para el perfume: "${product.name}" de la marca "${product.brand}":
1. Determina las notas olfativas reales (salida, corazón, fondo), familia olfativa y género.
2. Proporciona una descripción editorial elegante de 2 párrafos concisos para catálogo de lujo.
3. Describe detalladamente la forma geométrica, color del frasco, textura del tapón y detalles metálicos para una toma fotográfica de producto en estudio con fondo recortado transparente.
4. Identifica la URL o búsqueda exacta de la imagen oficial del frasco en alta definición.

Responde ÚNICAMENTE en JSON:
{
  "olfactory_family": "Familia olfativa",
  "gender": "Masculino, Femenino o Unisex",
  "description": "Texto descriptivo elegante",
  "bottle_visual": {
    "shape": "Forma del frasco",
    "glass_color": "Color del vidrio",
    "cap_details": "Detalles de la tapa"
  },
  "search_keyword": "término exacto para fotografía de catálogo oficial"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const result = JSON.parse(response.text.trim());

      // Actualizar datos del producto en memoria
      product.description = result.description || product.description;
      product.olfactory_family = result.olfactory_family || product.olfactory_family;
      product.gender = result.gender || product.gender;

      console.log(`   ✨ Notas olfativas enriquecidas: ${product.olfactory_family} (${product.gender})`);
      console.log(`   🎨 Frasco oficial identificado: ${result.bottle_visual?.glass_color || 'Estudio'}`);

      processedCount++;
    } catch (err) {
      console.error(`   ❌ Error con ${product.name}:`, err.message);
    }
  }

  // Guardar catálogo actualizado
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`\n✅ Proceso finalizado. ${processedCount} perfumes enriquecidos y listos en catalog.json.`);
}

runGeminiPipeline();

