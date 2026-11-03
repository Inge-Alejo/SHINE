import { getAll, getOne } from './db.js';
import { verifyAuth } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const admin = verifyAuth(req);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    const totalRow = await getOne('SELECT count(*) as count FROM products');
    const total = parseInt(totalRow?.count || 0, 10);

    const byCatRows = await getAll('SELECT category, count(*) as count FROM products GROUP BY category');
    const byCategory = {};
    byCatRows.forEach(r => { byCategory[r.category] = parseInt(r.count, 10); });

    const bySubcatRows = await getAll("SELECT COALESCE(subcategory, 'Pendiente') as subcat, count(*) as count FROM products WHERE category = 'Inspiraciones' GROUP BY subcategory");
    const bySubcategory = {};
    bySubcatRows.forEach(r => { bySubcategory[r.subcat] = parseInt(r.count, 10); });

    const withImgRow = await getOne("SELECT count(*) as count FROM products WHERE image_url IS NOT NULL AND image_url != ''");
    const withImage = parseInt(withImgRow?.count || 0, 10);

    let sheetsConfig = { connection_status: 'Sin configurar', total_detected: 0 };
    try {
      sheetsConfig = (await getOne('SELECT * FROM sheets_config WHERE id = 1')) || sheetsConfig;
    } catch {}

    let history = [];
    try {
      history = await getAll('SELECT * FROM sync_history ORDER BY synced_at DESC LIMIT 10');
    } catch {}

    return res.status(200).json({
      success: true,
      data: {
        total_products: total,
        by_category: byCategory,
        by_subcategory: bySubcategory,
        with_image: withImage,
        without_image: Math.max(0, total - withImage),
        sheets_status: {
          status: sheetsConfig.connection_status || 'Sin configurar',
          sheet_url: sheetsConfig.sheet_url || '',
          last_sync_at: sheetsConfig.last_sync_at || null,
          total_detected: sheetsConfig.total_detected || 0,
          total_added: sheetsConfig.total_added || 0,
          total_updated: sheetsConfig.total_updated || 0,
          total_skipped: sheetsConfig.total_skipped || 0
        },
        recent_activity: history
      }
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

