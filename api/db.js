import pg from 'pg';
import path from 'path';
import fs from 'fs';

const { Pool } = pg;

// Detectar connection string de Vercel Postgres / Neon
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

let pgPool = null;
if (connectionString) {
  pgPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000
  });
}

// Fallback a SQLite para desarrollo local offline si no hay Postgres configurado
let sqliteDb = null;
async function getSqliteDb() {
  if (sqliteDb) return sqliteDb;
  const { DatabaseSync } = await import('node:sqlite');
  const dbPath = path.resolve('backend/data/shine.db');
  if (fs.existsSync(dbPath)) {
    sqliteDb = new DatabaseSync(dbPath);
  }
  return sqliteDb;
}

/**
 * Convierte consultas SQL con '?' a '$1, $2...' para compatibilidad con Postgres
 */
function toPgQuery(sql, params = []) {
  let paramIdx = 1;
  const pgSql = sql.replace(/\?/g, () => `$${paramIdx++}`);
  return { pgSql, params };
}

/**
 * Ejecuta una consulta y retorna todas las filas
 */
export async function getAll(sql, params = []) {
  if (pgPool) {
    const { pgSql, params: pgParams } = toPgQuery(sql, params);
    const result = await pgPool.query(pgSql, pgParams);
    return result.rows;
  }

  const localDb = await getSqliteDb();
  if (localDb) {
    return localDb.prepare(sql).all(...params);
  }

  return [];
}

/**
 * Ejecuta una consulta y retorna una sola fila
 */
export async function getOne(sql, params = []) {
  if (pgPool) {
    const { pgSql, params: pgParams } = toPgQuery(sql, params);
    const result = await pgPool.query(pgSql, pgParams);
    return result.rows[0] || null;
  }

  const localDb = await getSqliteDb();
  if (localDb) {
    return localDb.prepare(sql).get(...params) || null;
  }

  return null;
}

/**
 * Ejecuta INSERT / UPDATE / DELETE
 */
export async function execute(sql, params = []) {
  if (pgPool) {
    const { pgSql, params: pgParams } = toPgQuery(sql, params);
    const result = await pgPool.query(pgSql, pgParams);
    return { rowCount: result.rowCount };
  }

  const localDb = await getSqliteDb();
  if (localDb) {
    const info = localDb.prepare(sql).run(...params);
    return { rowCount: info.changes };
  }

  return { rowCount: 0 };
}

/**
 * Ejecuta transacciones o bloques raw SQL
 */
export async function raw(sql) {
  if (pgPool) {
    return await pgPool.query(sql);
  }
  const localDb = await getSqliteDb();
  if (localDb) {
    return localDb.exec(sql);
  }
}

export default {
  getAll,
  getOne,
  execute,
  raw,
  isPostgres: () => Boolean(pgPool)
};
