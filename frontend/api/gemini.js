import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from './_auth.js';
import { getOne, execute } from './db.js';

const apiKey = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const admin = verifyAuth(req);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
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

    // Acción 1: Enriquecer notas olfativas y descripción de un perfume
    if (action === 'enrich') {
      const { perfume_name, brand, product_id } = input;
      if (!perfume_name) {
        return res.status(400).json({ success: false, error: 'perfume_name requerido' });
      }

      const prompt = `Actúa como un maestro perfumista internacional.
Proporciona la ficha técnica oficial del perfume: "${perfume_name}" de la casa "${brand || ''}".
Responde ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
{
  "olfactory_family": "Familia olfativa principal (ej: Oriental Amaderada)",
  "gender": "Masculino, Femenino o Unisex",
  "top_notes": "Notas de salida separadas por coma",
  "heart_notes": "Notas de corazón separadas por coma",
  "base_notes": "Notas de fondo separadas por coma",
  "description": "Descripción editorial elegante de 2 o 3 oraciones en español resaltando su personalidad y acordes principales.",
  "official_bottle_description": "Descripción física del frasco oficial (color del vidrio, forma, color de tapa, detalles)"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text.trim());

      // Si se envió product_id, actualizar la base de datos automáticamente
      if (product_id) {
        await execute(
          `UPDATE products 
           SET olfactory_family = ?, gender = ?, description = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [parsed.olfactory_family, parsed.gender, parsed.description, product_id]
        );
      }

      return res.status(200).json({
        success: true,
        data: parsed,
        updated_in_db: Boolean(product_id)
      });
    }

    // Acción 2: Búsqueda del frasco y características visuales para recorte sin fondo
    if (action === 'bottle_reference') {
      const { perfume_name, brand } = input;
      const prompt = `Investiga la fotografía oficial de producto del perfume: "${perfume_name}" de la marca "${brand || ''}".
Indica:
1. El enlace oficial o nombre exacto con el que se cataloga internacionalmente.
2. Características del frasco: color exacto del líquido, color de la botella, tapón y acabado.
3. Recomendaciones para recortar el fondo a transparente (canal alfa) respetando la silueta del frasco.
Responde en JSON:
{
  "query_reference": "Nombre exacto de búsqueda",
  "bottle_color": "Color",
  "cap_style": "Estilo del tapón",
  "transparency_advice": "Consejo de extracción"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      return res.status(200).json({
        success: true,
        reference: JSON.parse(response.text.trim())
      });
    }

    return res.status(400).json({ success: false, error: 'Acción no soportada' });
  } catch (error) {
    console.error('Error al llamar a Gemini API:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

