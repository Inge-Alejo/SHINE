import { getAll, getOne, execute } from './db.js';
import { verifyAuth } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const admin = verifyAuth(req);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const { method, query } = req;
  const action = query.action;

  if (method === 'GET' && action === 'pending') {
    try {
      const pendingProds = await getAll(
        "SELECT id, name, brand, category, subcategory FROM products WHERE image_url IS NULL OR image_url = '' ORDER BY brand ASC, name ASC"
      );
      const candidates = await getAll(
        `SELECT pi.*, p.name as product_name, p.brand as product_brand
         FROM product_images pi
         JOIN products p ON pi.product_id = p.id
         WHERE pi.validation_status IN ('pendiente', 'candidato')
         ORDER BY pi.created_at DESC`
      );

      return res.status(200).json({
        success: true,
        products_without_image: pendingProds,
        image_candidates: candidates
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (method === 'POST' && action === 'approve') {
    try {
      const { image_id } = req.body || {};
      if (!image_id) return res.status(400).json({ success: false, error: 'image_id requerido' });

      const candidate = await getOne('SELECT * FROM product_images WHERE id = ?', [image_id]);
      if (!candidate) return res.status(404).json({ success: false, error: 'Candidato no encontrado' });

      // Actualizar producto con la imagen aprobada
      await execute('UPDATE products SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [candidate.image_path, candidate.product_id]);
      await execute("UPDATE product_images SET validation_status = 'aprobado', is_primary = 1 WHERE id = ?", [image_id]);
      await execute("UPDATE product_images SET is_primary = 0 WHERE product_id = ? AND id != ?", [candidate.product_id, image_id]);

      return res.status(200).json({ success: true, message: 'Fotografía aprobada y asignada al perfume exitosamente' });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (method === 'POST' && action === 'assign_url') {
    try {
      const { product_id, image_url, notes } = req.body || {};
      if (!product_id || !image_url) {
        return res.status(400).json({ success: false, error: 'product_id e image_url requeridos' });
      }

      await execute('UPDATE products SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [image_url, product_id]);
      await execute(
        `INSERT INTO product_images (product_id, image_path, source_name, validation_status, is_primary, verification_notes)
         VALUES (?, ?, 'Asignación Manual Admin', 'aprobado', 1, ?)`,
        [product_id, image_url, notes || 'Asignada desde panel']
      );

      return res.status(200).json({ success: true, message: 'Imagen asignada al perfume en tiempo real' });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(400).json({ success: false, error: 'Acción no soportada' });
}
