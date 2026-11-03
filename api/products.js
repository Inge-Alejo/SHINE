import { getAll, getOne, execute } from './db.js';
import { verifyAuth } from './_auth.js';

export default async function handler(req, res) {
  // Configuración de respuesta en tiempo real sin caché intermedia
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { method, query } = req;

  // 1. GET: Consultar productos
  if (method === 'GET') {
    try {
      if (query.id) {
        const product = await getOne('SELECT * FROM products WHERE id = ?', [query.id]);
        if (!product) {
          return res.status(404).json({ success: false, error: 'Perfume no encontrado' });
        }
        const images = await getAll('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC', [query.id]);
        product.images = images;
        return res.status(200).json({ success: true, data: product });
      }

      const conditions = [];
      const params = [];

      if (query.category) {
        conditions.push('category = ?');
        params.push(query.category);
      }

      if (query.subcategory) {
        if (query.subcategory === 'pendiente' || query.subcategory === 'null') {
          conditions.push('subcategory IS NULL');
        } else {
          conditions.push('subcategory = ?');
          params.push(query.subcategory);
        }
      }

      if (query.brand) {
        conditions.push('brand = ?');
        params.push(query.brand);
      }

      if (query.gender) {
        conditions.push('gender = ?');
        params.push(query.gender);
      }

      if (query.status && query.status !== 'all') {
        conditions.push('status = ?');
        params.push(query.status);
      } else if (!query.status) {
        conditions.push("status = 'publicado'");
      }

      if (query.search) {
        const term = `%${query.search.trim().toLowerCase()}%`;
        conditions.push('(LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(description) LIKE ? OR LOWER(olfactory_family) LIKE ? OR LOWER(raw_inspiracion) LIKE ?)');
        params.push(term, term, term, term, term);
      }

      const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

      // Total count
      const countRow = await getOne(`SELECT count(*) as count FROM products ${whereClause}`, params);
      const total = parseInt(countRow?.count || 0, 10);

      const limitParam = query.limit;
      const isAll = limitParam === 'all' || limitParam === '0';
      const limit = isAll ? 10000 : Math.min(10000, parseInt(limitParam || 1000, 10));
      const page = Math.max(1, parseInt(query.page || 1, 10));
      const offset = isAll ? 0 : (page - 1) * limit;

      const rows = await getAll(
        `SELECT * FROM products ${whereClause} ORDER BY brand ASC, name ASC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const brandsRows = await getAll("SELECT DISTINCT brand FROM products WHERE status = 'publicado' ORDER BY brand ASC");
      const brands = brandsRows.map(b => b.brand);

      return res.status(200).json({
        success: true,
        total,
        count: rows.length,
        page,
        limit,
        brands,
        data: rows
      });
    } catch (error) {
      console.error('Error al listar productos:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // 2. Operaciones Administrativas (POST, PUT, DELETE)
  const admin = verifyAuth(req);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'No autorizado. Se requiere sesión de administrador.' });
  }

  if (method === 'POST') {
    try {
      const input = req.body || {};
      const id = input.id || `SHINE-${String(Date.now()).slice(-4)}`;

      await execute(
        `INSERT INTO products (id, name, brand, raw_inspiracion, raw_casa, description, olfactory_family, gender, category, subcategory, image_url, status, manual_override)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          id, input.name, input.brand, input.name, input.brand, input.description || '',
          input.olfactory_family || '', input.gender || 'Unisex', input.category || 'Inspiraciones',
          input.subcategory || null, input.image_url || null, input.status || 'publicado'
        ]
      );

      return res.status(201).json({ success: true, message: 'Producto creado exitosamente en base de datos', data: { id } });
    } catch (error) {
      console.error('Error al crear producto:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (method === 'PUT') {
    try {
      const input = req.body || {};
      const id = query.id;

      if (!id) return res.status(400).json({ success: false, error: 'ID de producto requerido' });

      await execute(
        `UPDATE products SET name = ?, brand = ?, category = ?, subcategory = ?, description = ?, olfactory_family = ?, gender = ?, image_url = ?, status = ?, manual_override = 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          input.name, input.brand, input.category, input.subcategory || null,
          input.description, input.olfactory_family, input.gender,
          input.image_url, input.status, id
        ]
      );

      return res.status(200).json({ success: true, message: 'Producto actualizado en tiempo real' });
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (method === 'DELETE') {
    try {
      const id = query.id;
      if (!id) return res.status(400).json({ success: false, error: 'ID de producto requerido' });

      await execute('DELETE FROM products WHERE id = ?', [id]);
      return res.status(200).json({ success: true, message: 'Producto eliminado del catálogo' });
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: `Método ${method} no permitido` });
}
