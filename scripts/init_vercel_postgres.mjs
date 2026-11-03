/**
 * SHINE Fragancias - Migración e Inicialización de Vercel Postgres / Neon
 * 
 * Uso:
 *   1. Mediante variable de entorno:
 *      POSTGRES_URL="postgres://..." node scripts/init_vercel_postgres.mjs
 * 
 *   2. O pasando la URL directamente por argumento:
 *      node scripts/init_vercel_postgres.mjs "postgres://..."
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const { Client } = pg;

const connectionString = process.argv[2] || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('\n❌ ERROR: No se proporcionó la URL de conexión de Postgres.');
  console.error('Proporciona POSTGRES_URL como variable de entorno o como argumento:');
  console.error('node scripts/init_vercel_postgres.mjs "postgres://default:xxx@ep-xxx.us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require"\n');
  process.exit(1);
}

async function runMigration() {
  console.log('\n🚀 Iniciando conexión con Vercel Postgres / Neon...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexión establecida con éxito.');

    // 1. Crear Esquema
    console.log('\n📦 Creando tablas en Vercel Postgres...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(32) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255) NOT NULL,
        raw_inspiracion VARCHAR(255),
        raw_casa VARCHAR(255),
        description TEXT,
        olfactory_family VARCHAR(100),
        gender VARCHAR(50) DEFAULT 'Unisex',
        category VARCHAR(50) NOT NULL DEFAULT 'Inspiraciones',
        subcategory VARCHAR(50),
        image_url VARCHAR(500),
        status VARCHAR(20) NOT NULL DEFAULT 'publicado',
        source_page INT,
        manual_override INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(32) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_path VARCHAR(500) NOT NULL,
        source_url TEXT,
        source_domain VARCHAR(255),
        source_name VARCHAR(255),
        validation_status VARCHAR(50) NOT NULL DEFAULT 'pendiente',
        is_primary INT DEFAULT 0,
        verification_notes TEXT,
        ai_confidence_score NUMERIC(3,2),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key_name VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        description VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS sheets_config (
        id INT PRIMARY KEY,
        sheet_url TEXT,
        sheet_tab VARCHAR(100) DEFAULT 'Hoja 1',
        connection_status VARCHAR(50) DEFAULT 'Sin configurar',
        last_sync_at TIMESTAMPTZ,
        total_detected INT DEFAULT 0,
        total_added INT DEFAULT 0,
        total_updated INT DEFAULT 0,
        total_skipped INT DEFAULT 0,
        total_errors INT DEFAULT 0,
        column_mapping TEXT,
        auth_mode VARCHAR(50) DEFAULT 'csv_or_public',
        auth_payload TEXT,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sync_history (
        id SERIAL PRIMARY KEY,
        synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL,
        items_detected INT DEFAULT 0,
        items_added INT DEFAULT 0,
        items_updated INT DEFAULT 0,
        items_skipped INT DEFAULT 0,
        items_errors INT DEFAULT 0,
        log_details TEXT
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        user_name VARCHAR(50) NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Esquema creado con éxito.');

    // 2. Insertar Configuración Comercial Predeterminada
    console.log('\n⚙️ Configurando tarifas comerciales y WhatsApp oficial...');
    const defaultSettings = [
      ['brand_name', 'SHINE Fragancias', 'Nombre comercial de la marca'],
      ['whatsapp_number', '573105964755', 'WhatsApp en formato internacional (573105964755)'],
      ['whatsapp_display', '+57 310 5964755', 'WhatsApp visible al usuario'],
      ['price_30ml', '17000', 'Tarifa 30 ml COP'],
      ['price_60ml', '24000', 'Tarifa 60 ml COP'],
      ['price_100ml', '37000', 'Tarifa 100 ml COP'],
      ['currency', 'COP', 'Moneda comercial']
    ];

    for (const [k, v, desc] of defaultSettings) {
      await client.query(`
        INSERT INTO settings (key_name, value, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (key_name) DO UPDATE SET value = EXCLUDED.value
      `, [k, v, desc]);
    }
    console.log('✅ Tarifas ($17k, $24k, $37k) y WhatsApp centralizados en Postgres.');

    // 3. Insertar Usuario Administrador
    console.log('\n🔐 Creando usuario administrador inicial en Postgres...');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('shine2026!', salt);

    await client.query(`
      INSERT INTO admin_users (username, password_hash, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', hash, 'Administrador SHINE']);
    console.log('✅ Usuario admin registrado.');

    // 4. Sembrar Catálogo Inicial de 394 Productos
    const catalogPath = path.resolve('frontend/public/data/catalog.json');
    if (fs.existsSync(catalogPath)) {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      console.log(`\n📚 Sembrando catálogo inicial de ${catalog.length} perfumes extraídos del PDF...`);

      let insertedCount = 0;
      for (const p of catalog) {
        await client.query(`
          INSERT INTO products (
            id, name, brand, raw_inspiracion, raw_casa, description,
            olfactory_family, gender, category, subcategory, image_url,
            status, source_page, manual_override
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            brand = EXCLUDED.brand,
            category = EXCLUDED.category,
            subcategory = EXCLUDED.subcategory,
            description = EXCLUDED.description,
            image_url = COALESCE(products.image_url, EXCLUDED.image_url)
        `, [
          p.id, p.name, p.brand, p.raw_inspiracion || p.name, p.raw_casa || p.brand,
          p.description || '', p.olfactory_family || '', p.gender || 'Unisex',
          p.category || 'Inspiraciones', p.subcategory || null, p.image_url || null,
          p.status || 'publicado', p.source_page || 1, p.manual_override || 0
        ]);
        insertedCount++;
      }
      console.log(`✅ ${insertedCount} perfumes sincronizados exitosamente en Postgres.`);
    }

    // 5. Configuración inicial Google Sheets
    await client.query(`
      INSERT INTO sheets_config (id, connection_status, sheet_tab)
      VALUES (1, 'Sin configurar', 'Hoja 1')
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('\n===============================================================');
    console.log('  🎉 ¡BASE DE DATOS VERCEL POSTGRES / NEON INICIALIZADA AL 100%! ');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('❌ Error durante la migración:', err);
  } finally {
    await client.end();
  }
}

runMigration();
