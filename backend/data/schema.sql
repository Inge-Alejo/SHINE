-- SHINE Fragancias - Esquema de Base de Datos
-- Compatible con MySQL 5.7+ / 8.0 / MariaDB y SQLite

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id VARCHAR(32) NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    source_url TEXT,
    source_domain VARCHAR(255),
    source_name VARCHAR(255),
    validation_status VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    is_primary INT DEFAULT 0,
    verification_notes TEXT,
    ai_confidence_score DECIMAL(3,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
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
    last_sync_at DATETIME,
    total_detected INT DEFAULT 0,
    total_added INT DEFAULT 0,
    total_updated INT DEFAULT 0,
    total_skipped INT DEFAULT 0,
    total_errors INT DEFAULT 0,
    column_mapping TEXT,
    auth_mode VARCHAR(50) DEFAULT 'csv_or_public',
    auth_payload TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    items_detected INT DEFAULT 0,
    items_added INT DEFAULT 0,
    items_updated INT DEFAULT 0,
    items_skipped INT DEFAULT 0,
    items_errors INT DEFAULT 0,
    log_details TEXT
);

CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    user VARCHAR(50) NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

