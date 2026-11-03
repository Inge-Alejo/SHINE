<?php
require_once __DIR__ . '/db.php';

requireAdminAuth();
$pdo = getDbConnection();

// 1. Conteo total de productos
$totalProds = intval($pdo->query("SELECT COUNT(*) FROM products")->fetchColumn());

// 2. Conteo por categoría
$catStmt = $pdo->query("SELECT category, COUNT(*) as count FROM products GROUP BY category");
$byCategory = [];
while ($row = $catStmt->fetch()) {
    $byCategory[$row['category']] = intval($row['count']);
}

// 3. Conteo por subcategoría (Inspiraciones)
$subcatStmt = $pdo->query("SELECT COALESCE(subcategory, 'Pendiente') as subcat, COUNT(*) as count FROM products WHERE category = 'Inspiraciones' GROUP BY subcategory");
$bySubcategory = [];
while ($row = $subcatStmt->fetch()) {
    $bySubcategory[$row['subcat']] = intval($row['count']);
}

// 4. Conteo por estado de publicación
$statusStmt = $pdo->query("SELECT status, COUNT(*) as count FROM products GROUP BY status");
$byStatus = [];
while ($row = $statusStmt->fetch()) {
    $byStatus[$row['status']] = intval($row['count']);
}

// 5. Productos con y sin imagen
$withImage = intval($pdo->query("SELECT COUNT(*) FROM products WHERE image_url IS NOT NULL AND image_url != ''")->fetchColumn());
$withoutImage = $totalProds - $withImage;

// 6. Estado de Google Sheets
$sheetsStmt = $pdo->query("SELECT * FROM sheets_config WHERE id = 1 LIMIT 1");
$sheetsConfig = $sheetsStmt->fetch() ?: [
    'connection_status' => 'Sin configurar',
    'last_sync_at' => null,
    'total_detected' => 0,
    'total_added' => 0,
    'total_updated' => 0,
    'total_skipped' => 0,
    'total_errors' => 0
];

// 7. Actividad reciente de auditoría
$auditStmt = $pdo->query("SELECT * FROM audit_log ORDER BY id DESC LIMIT 10");
$recentActivity = $auditStmt->fetchAll();

sendJsonResponse([
    'success' => true,
    'data' => [
        'total_products' => $totalProds,
        'by_category' => $byCategory,
        'by_subcategory' => $bySubcategory,
        'by_status' => $byStatus,
        'with_image' => $withImage,
        'without_image' => $withoutImage,
        'sheets_status' => [
            'status' => $sheetsConfig['connection_status'],
            'sheet_url' => $sheetsConfig['sheet_url'],
            'last_sync_at' => $sheetsConfig['last_sync_at'],
            'total_detected' => intval($sheetsConfig['total_detected']),
            'total_added' => intval($sheetsConfig['total_added']),
            'total_updated' => intval($sheetsConfig['total_updated']),
            'total_skipped' => intval($sheetsConfig['total_skipped']),
            'total_errors' => intval($sheetsConfig['total_errors'])
        ],
        'recent_activity' => $recentActivity
    ]
]);

