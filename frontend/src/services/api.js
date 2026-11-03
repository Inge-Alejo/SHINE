/**
 * SHINE Fragancias - Servicio de API Frontend (Producción Vercel & Real-Time)
 * Conexión nativa con Vercel Serverless Functions (/api/*) y Postgres Cloud.
 * Garantiza actualización en tiempo real en todos los dispositivos con directivas no-cache.
 */

// Detectar base URL de la API: estándar Vercel /api
const API_BASE = (function() {
  if (typeof window !== 'undefined') {
    // Si estamos en Vite dev con proxy
    if (window.location.port === '5173') {
      return '/api';
    }
    // En Vercel o producción
    return '/api';
  }
  return '/api';
})();

/**
 * Consulta la configuración comercial en tiempo real
 */
export async function fetchSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) return json.data;
    }
  } catch (err) {
    console.warn('API settings fallback to static data:', err);
  }

  // Fallback de respaldo offline
  try {
    const fallback = await fetch('./data/settings.json');
    if (fallback.ok) {
      const data = await fallback.json();
      return {
        brand_name: data.brand_name || 'SHINE Fragancias',
        whatsapp_number: data.whatsapp_number || '573105964755',
        whatsapp_display: data.whatsapp_display || '+57 310 5964755',
        currency: 'COP',
        prices: {
          '30ml': parseInt(data.price_30ml || 17000, 10),
          '60ml': parseInt(data.price_60ml || 24000, 10),
          '100ml': parseInt(data.price_100ml || 37000, 10)
        }
      };
    }
  } catch (e) {
    console.error('Settings fallback failed:', e);
  }

  // Fallback por defecto centralizado
  return {
    brand_name: 'SHINE Fragancias',
    whatsapp_number: '573105964755',
    whatsapp_display: '+57 310 5964755',
    currency: 'COP',
    prices: {
      '30ml': 17000,
      '60ml': 24000,
      '100ml': 37000
    }
  };
}

/**
 * Consulta el catálogo de productos con filtros dinámicos en tiempo real
 */
export async function fetchProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.subcategory) query.append('subcategory', params.subcategory);
  if (params.brand) query.append('brand', params.brand);
  if (params.gender) query.append('gender', params.gender);
  if (params.search) query.append('search', params.search);
  if (params.status) query.append('status', params.status);
  if (params.limit) query.append('limit', params.limit);
  if (params.page) query.append('page', params.page);
  if (params.sort) query.append('sort', params.sort);

  // Parámetro anti-caché para sincronización en tiempo real entre dispositivos
  query.append('_t', Date.now());

  try {
    const res = await fetch(`${API_BASE}/products?${query.toString()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return json;
    }
  } catch (err) {
    console.warn('API products fallback to static catalog:', err);
  }

  // Fallback estático en caso de no tener internet
  try {
    const fallback = await fetch('./data/catalog.json');
    if (fallback.ok) {
      let prods = await fallback.json();

      if (params.category) {
        prods = prods.filter(p => p.category === params.category);
      }
      if (params.subcategory) {
        if (params.subcategory === 'pendiente') {
          prods = prods.filter(p => !p.subcategory);
        } else {
          prods = prods.filter(p => p.subcategory === params.subcategory);
        }
      }
      if (params.brand) {
        prods = prods.filter(p => p.brand === params.brand);
      }
      if (params.gender) {
        prods = prods.filter(p => p.gender === params.gender);
      }
      if (params.search) {
        const term = params.search.toLowerCase();
        prods = prods.filter(p => 
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.brand && p.brand.toLowerCase().includes(term)) ||
          (p.description && p.description.toLowerCase().includes(term)) ||
          (p.olfactory_family && p.olfactory_family.toLowerCase().includes(term))
        );
      }

      const brands = Array.from(new Set(prods.map(p => p.brand))).sort();

      return {
        success: true,
        total: prods.length,
        count: prods.length,
        brands: brands,
        data: prods
      };
    }
  } catch (e) {
    console.error('Catalog fallback failed:', e);
  }

  return { success: false, total: 0, count: 0, brands: [], data: [] };
}

// ==========================================
// MÉTODOS DE ADMINISTRACIÓN (PROTEGIDOS POR JWT)
// ==========================================

export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/auth?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function fetchDashboard(token) {
  const res = await fetch(`${API_BASE}/dashboard?_t=${Date.now()}`, {
    cache: 'no-store',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store'
    }
  });
  return res.json();
}

export async function updateCommercialSettings(token, settingsData) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(settingsData)
  });
  return res.json();
}

export async function createProduct(token, productData) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  return res.json();
}

export async function updateProduct(token, id, productData) {
  const res = await fetch(`${API_BASE}/products?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  return res.json();
}

export async function deleteProduct(token, id) {
  const res = await fetch(`${API_BASE}/products?id=${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

// Google Sheets Sync
export async function getSheetsConfig(token) {
  const res = await fetch(`${API_BASE}/sheets-sync`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function saveSheetsConfig(token, configData) {
  const res = await fetch(`${API_BASE}/sheets-sync?action=save_config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(configData)
  });
  return res.json();
}

export async function testSheetsConnection(token, payload) {
  const res = await fetch(`${API_BASE}/sheets-sync?action=test_connection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function triggerSheetsSync(token) {
  const res = await fetch(`${API_BASE}/sheets-sync?action=sync_now`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function disconnectSheets(token) {
  const res = await fetch(`${API_BASE}/sheets-sync?action=disconnect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

// Image Manager
export async function fetchPendingImages(token) {
  const res = await fetch(`${API_BASE}/image-manager?action=pending`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function uploadProductImage(token, formData) {
  const res = await fetch(`${API_BASE}/image-manager?action=upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  return res.json();
}

export async function approveImageCandidate(token, imageId) {
  const res = await fetch(`${API_BASE}/image-manager?action=approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ image_id: imageId })
  });
  return res.json();
}

// ==========================================
// GEMINI AI INTEGRATION
// ==========================================

export async function enrichWithGemini(token, payload) {
  const res = await fetch(`${API_BASE}/gemini?action=enrich`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function getGeminiBottleReference(token, payload) {
  const res = await fetch(`${API_BASE}/gemini?action=bottle_reference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
}
