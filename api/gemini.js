import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from './_auth.js';
import { getOne, execute } from './db.js';

const apiKey = process.env.GEMINI_API_KEY;

// Prioridad de modelos: 3.5 Flash Lite y 3.1 Flash Lite en primer lugar con respaldo automático
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
].filter(Boolean);

async function callGeminiModel(ai, prompt, isJson = true) {
  let lastError = null;
  const config = isJson ? { responseMimeType: 'application/json' } : {};

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config
      });
      return { response, modelUsed: modelName };
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini API] Modelo ${modelName} falló o no disponible (${err.message}). Intentando siguiente modelo en cascada...`);
    }
  }

  throw lastError || new Error('No se pudo conectar con ningún modelo de Gemini disponible');
}

function normalizeGender(raw) {
  const str = String(raw || '').toLowerCase().trim();
  if (str.includes('unisex') || str.includes('ambos') || str.includes('compartid')) return 'Unisex';
  if (str.includes('masculin') || str.includes('hombre')) return 'Hombre';
  if (str.includes('femenin') || str.includes('mujer')) return 'Mujer';
  return 'Unisex';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const admin = verifyAuth(req);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado. Se requiere sesión de administrador.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  if (!apiKey) {
    return res.status(503).json({
      success: false,
      error: 'GEMINI_API_KEY no está configurada en las Variables de Entorno de Vercel.',
      hint: 'Agrega GEMINI_API_KEY en Project Settings > Environment Variables en Vercel.'
    });
  }

  const { action } = req.query;
  const input = req.body || {};

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Acción 1: Enriquecer un solo perfume
    if (action === 'enrich') {
      const { perfume_name, brand, product_id, custom_image_url } = input;
      if (!perfume_name) {
        return res.status(400).json({ success: false, error: 'perfume_name requerido' });
      }

      const prompt = `Actúa como un maestro perfumista internacional y redactor editorial de fragancias de lujo.
Proporciona la ficha técnica oficial del perfume: "${perfume_name}" de la casa "${brand || ''}".
IMPORTANTE sobre el género: Clasifica estrictamente como "Hombre", "Mujer" o "Unisex". Ten en cuenta que la gran mayoría de perfumes árabes, orientales y nicho (como Afnan, Lattafa, Al Haramain, Armaf, Creed, Tom Ford, etc.) son UNISEX. En caso de duda o versatilidad, clasifícalo siempre como "Unisex".
Responde ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
{
  "olfactory_family": "Familia olfativa principal (ej: Oriental Amaderada)",
  "gender": "Hombre, Mujer o Unisex",
  "top_notes": "Notas de salida separadas por coma",
  "heart_notes": "Notas de corazón separadas por coma",
  "base_notes": "Notas de fondo separadas por coma",
  "description": "Descripción editorial elegante de 2 o 3 oraciones en español resaltando su personalidad y acordes principales.",
  "official_bottle_description": "Descripción física del frasco oficial (color del vidrio, forma, color de tapa, detalles)"
}`;

      const { response, modelUsed } = await callGeminiModel(ai, prompt, true);
      const parsed = JSON.parse(response.text.trim());
      parsed.gender = normalizeGender(parsed.gender);

      // Si se envió product_id, actualizar la base de datos automáticamente
      if (product_id) {
        let updateSql = `
          UPDATE products 
          SET olfactory_family = ?, gender = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        `;
        const params = [parsed.olfactory_family, parsed.gender, parsed.description];

        if (custom_image_url) {
          updateSql += `, image_url = ?`;
          params.push(custom_image_url);
        }

        updateSql += ` WHERE id = ?`;
        params.push(product_id);

        await execute(updateSql, params);

        // Guardar en bitácora de auditoría
        await execute(
          `INSERT INTO audit_log (entity_type, entity_id, action, user_name, details)
           VALUES ('product', ?, 'gemini_enrich', 'admin', ?)`,
          [product_id, `Notas agregadas: ${parsed.olfactory_family} | Salida: ${parsed.top_notes}`]
        );
      }

      return res.status(200).json({
        success: true,
        data: parsed,
        model_used: modelUsed,
        updated_in_db: Boolean(product_id)
      });
    }

    // Acción 2: Enriquecimiento en Lote (Batch)
    if (action === 'batch_enrich') {
      const items = input.items || [];
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Lista de items vacía' });
      }

      // Procesar lote con límite de seguridad
      const maxBatch = Math.min(items.length, 10);
      const results = [];

      for (let i = 0; i < maxBatch; i++) {
        const item = items[i];
        try {
          const prompt = `Ficha técnica concisa para perfume "${item.name}" de "${item.brand || ''}".
IMPORTANTE: "gender" debe ser estrictamente "Hombre", "Mujer" o "Unisex". Recuerda que la gran mayoría de perfumes árabes u orientales son Unisex.
JSON estricto:
{
  "olfactory_family": "Familia",
  "gender": "Hombre, Mujer o Unisex",
  "description": "Descripción elegante de 2 frases en español.",
  "top_notes": "Notas salida",
  "heart_notes": "Notas corazón",
  "base_notes": "Notas fondo"
}`;

          const { response: resp, modelUsed } = await callGeminiModel(ai, prompt, true);
          const pData = JSON.parse(resp.text.trim());
          pData.gender = normalizeGender(pData.gender);

          await execute(
            `UPDATE products 
             SET olfactory_family = ?, gender = ?, description = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [pData.olfactory_family, pData.gender, pData.description, item.id]
          );

          results.push({ id: item.id, name: item.name, success: true, model_used: modelUsed, data: pData });
        } catch (itemErr) {
          results.push({ id: item.id, name: item.name, success: false, error: itemErr.message });
        }
      }

      return res.status(200).json({
        success: true,
        processed: results.length,
        results
      });
    }

    // Acción 3: Búsqueda del frasco y características visuales para recorte sin fondo
    if (action === 'bottle_reference') {
      const { perfume_name, brand } = input;
      const prompt = `Investiga la fotografía oficial de producto del perfume: "${perfume_name}" de la marca "${brand || ''}".
Indica:
1. El término de búsqueda exacto en inglés y español para encontrar la imagen en alta definición.
2. Características del frasco: color exacto del líquido, color de la botella, tapón y acabado.
3. Recomendaciones para recortar el fondo a transparente (canal alfa PNG) respetando la silueta del frasco.
Responde en JSON:
{
  "query_reference": "Nombre exacto de búsqueda",
  "bottle_color": "Color",
  "cap_style": "Estilo del tapón",
  "transparency_advice": "Consejo de extracción"
}`;

      const { response, modelUsed } = await callGeminiModel(ai, prompt, true);

      return res.status(200).json({
        success: true,
        model_used: modelUsed,
        reference: JSON.parse(response.text.trim())
      });
    }

    return res.status(400).json({ success: false, error: 'Acción no soportada' });
  } catch (error) {
    console.error('Error al llamar a Gemini API:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
