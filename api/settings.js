import { getAll, execute } from './db.js';
import { verifyAuth } from './_auth.js';

export default async function handler(req, res) {
  // Configuración de respuesta en tiempo real estricta
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { method } = req;

  if (method === 'GET') {
    try {
      const rows = await getAll('SELECT key_name, value FROM settings');
      const setMap = {};
      rows.forEach(r => {
        setMap[r.key_name] = r.value;
      });

      return res.status(200).json({
        success: true,
        data: {
          brand_name: setMap.brand_name || 'SHINE Fragancias',
          whatsapp_number: setMap.whatsapp_number || '573105964755',
          whatsapp_display: setMap.whatsapp_display || '+57 310 5964755',
          currency: setMap.currency || 'COP',
          prices: {
            '30ml': parseInt(setMap.price_30ml || 17000, 10),
            '60ml': parseInt(setMap.price_60ml || 24000, 10),
            '100ml': parseInt(setMap.price_100ml || 37000, 10)
          }
        }
      });
    } catch (error) {
      console.error('Error al obtener settings:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (method === 'POST') {
    const admin = verifyAuth(req);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'No autorizado. Se requiere sesión de administrador.' });
    }

    try {
      const input = req.body || {};
      const keysToUpdate = ['whatsapp_number', 'whatsapp_display', 'price_30ml', 'price_60ml', 'price_100ml'];

      for (const key of keysToUpdate) {
        if (input[key] !== undefined) {
          await execute(
            `INSERT INTO settings (key_name, value) VALUES (?, ?)
             ON CONFLICT(key_name) DO UPDATE SET value = excluded.value`,
            [key, String(input[key])]
          );
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Configuración comercial y tarifas actualizadas en tiempo real en la base de datos'
      });
    } catch (error) {
      console.error('Error al actualizar settings:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: `Método ${method} no permitido` });
}
