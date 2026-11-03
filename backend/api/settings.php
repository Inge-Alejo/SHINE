<?php
require_once __DIR__ . '/db.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT key_name, value, description FROM settings");
    $rawSettings = $stmt->fetchAll();
    
    $settingsMap = [];
    foreach ($rawSettings as $row) {
        $settingsMap[$row['key_name']] = $row['value'];
    }

    sendJsonResponse([
        'success' => true,
        'data' => [
            'brand_name' => isset($settingsMap['brand_name']) ? $settingsMap['brand_name'] : 'SHINE Fragancias',
            'whatsapp_number' => isset($settingsMap['whatsapp_number']) ? $settingsMap['whatsapp_number'] : '573105964755',
            'whatsapp_display' => isset($settingsMap['whatsapp_display']) ? $settingsMap['whatsapp_display'] : '+57 310 5964755',
            'currency' => isset($settingsMap['currency']) ? $settingsMap['currency'] : 'COP',
            'prices' => [
                '30ml' => isset($settingsMap['price_30ml']) ? intval($settingsMap['price_30ml']) : 17000,
                '60ml' => isset($settingsMap['price_60ml']) ? intval($settingsMap['price_60ml']) : 24000,
                '100ml' => isset($settingsMap['price_100ml']) ? intval($settingsMap['price_100ml']) : 37000
            ],
            'contact_location' => isset($settingsMap['contact_location']) ? $settingsMap['contact_location'] : 'Colombia'
        ]
    ]);
} elseif ($method === 'POST') {
    // Requiere autenticación de administrador
    requireAdminAuth();
    $input = getJsonInput();

    $allowedKeys = [
        'whatsapp_number',
        'whatsapp_display',
        'price_30ml',
        'price_60ml',
        'price_100ml',
        'brand_name',
        'contact_location'
    ];

    $updated = [];
    $stmt = $pdo->prepare("INSERT INTO settings (key_name, value) VALUES (?, ?) ON CONFLICT(key_name) DO UPDATE SET value = excluded.value");
    
    // Si es MySQL usamos ON DUPLICATE KEY UPDATE
    if (getenv('DB_TYPE') === 'mysql') {
        $stmt = $pdo->prepare("INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)");
    }

    foreach ($input as $k => $v) {
        if (in_array($k, $allowedKeys)) {
            $stmt->execute([$k, strval($v)]);
            $updated[$k] = $v;
        }
    }

    // Registrar en audit_log
    $logStmt = $pdo->prepare("INSERT INTO audit_log (entity_type, entity_id, action, user, details) VALUES ('settings', 'commercial', 'update', 'admin', ?)");
    $logStmt->execute([json_encode($updated, JSON_UNESCAPED_UNICODE)]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Configuración comercial actualizada correctamente',
        'updated' => $updated
    ]);
} else {
    sendJsonResponse(['success' => false, 'error' => 'Método no permitido'], 405);
}

