<?php
require_once __DIR__ . '/db.php';

requireAdminAuth();
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. GET: Consultar configuración e historial
if ($method === 'GET') {
    $cfgStmt = $pdo->query("SELECT * FROM sheets_config WHERE id = 1 LIMIT 1");
    $config = $cfgStmt->fetch();

    $historyStmt = $pdo->query("SELECT * FROM sync_history ORDER BY synced_at DESC LIMIT 20");
    $history = $historyStmt->fetchAll();

    sendJsonResponse([
        'success' => true,
        'config' => $config,
        'history' => $history
    ]);
}

// 2. POST: Acciones de configuración, prueba y sincronización
if ($method === 'POST') {
    $input = getJsonInput();

    // A. Guardar configuración
    if ($action === 'save_config') {
        $sheetUrl = isset($input['sheet_url']) ? trim($input['sheet_url']) : '';
        $sheetTab = isset($input['sheet_tab']) && !empty($input['sheet_tab']) ? trim($input['sheet_tab']) : 'Hoja 1';
        $mapping = isset($input['column_mapping']) ? (is_array($input['column_mapping']) ? json_encode($input['column_mapping'], JSON_UNESCAPED_UNICODE) : $input['column_mapping']) : null;
        $authMode = isset($input['auth_mode']) ? trim($input['auth_mode']) : 'csv_or_public';
        $authPayload = isset($input['auth_payload']) ? trim($input['auth_payload']) : null;

        $newStatus = empty($sheetUrl) ? 'Sin configurar' : 'Pendiente de conexión';

        $stmt = $pdo->prepare("
            UPDATE sheets_config SET
                sheet_url = ?,
                sheet_tab = ?,
                column_mapping = COALESCE(?, column_mapping),
                auth_mode = ?,
                auth_payload = ?,
                connection_status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        ");
        $stmt->execute([$sheetUrl, $sheetTab, $mapping, $authMode, $authPayload, $newStatus]);

        sendJsonResponse([
            'success' => true,
            'message' => 'Configuración guardada correctamente',
            'status' => $newStatus
        ]);
    }

    // B. Probar conexión y obtener vista previa
    if ($action === 'test_connection') {
        $cfgStmt = $pdo->query("SELECT * FROM sheets_config WHERE id = 1 LIMIT 1");
        $config = $cfgStmt->fetch();
        $sheetUrl = isset($input['sheet_url']) ? trim($input['sheet_url']) : ($config['sheet_url'] ?? '');
        $sheetTab = isset($input['sheet_tab']) ? trim($input['sheet_tab']) : ($config['sheet_tab'] ?? 'Hoja 1');

        if (empty($sheetUrl)) {
            sendJsonResponse(['success' => false, 'error' => 'No se ha proporcionado una URL de Google Sheets'], 400);
        }

        // Extraer Spreadsheet ID
        // Formato estándar: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/...
        if (!preg_match('/spreadsheets\/d\/([a-zA-Z0-9-_]+)/', $sheetUrl, $matches)) {
            $updateStatus = $pdo->prepare("UPDATE sheets_config SET connection_status = 'Error de lectura' WHERE id = 1");
            $updateStatus->execute();
            sendJsonResponse([
                'success' => false,
                'error' => 'Formato de enlace inválido. Debe ser un enlace de Google Sheets (https://docs.google.com/spreadsheets/d/...)'
            ], 400);
        }

        $spreadsheetId = $matches[1];
        
        // Construir URL de exportación CSV segura para la pestaña especificada
        $encodedTab = urlencode($sheetTab);
        $csvUrl = "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/gviz/tq?tqx=out:csv&sheet={$encodedTab}";

        // Consulta cURL con timeout controlado
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $csvUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        curl_setopt($ch, CURLOPT_USERAGENT, 'SHINE-Fragancias-Sync/1.0');
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            $pdo->query("UPDATE sheets_config SET connection_status = 'Error de lectura' WHERE id = 1");
            sendJsonResponse([
                'success' => false,
                'error' => 'Error de conexión de red: ' . $curlError
            ], 500);
        }

        // Si responde con login de Google o error 401/403/404
        if ($httpCode === 401 || $httpCode === 403 || strpos($response, 'accounts.google.com') !== false) {
            $pdo->query("UPDATE sheets_config SET connection_status = 'Error de permisos' WHERE id = 1");
            sendJsonResponse([
                'success' => false,
                'status' => 'Error de permisos',
                'error' => 'El documento de Google Sheets es privado o requiere autorización. Para sincronizarlo, compártelo con permisos de lectura o configura un endpoint seguro de Google Apps Script.'
            ], 403);
        }

        if ($httpCode !== 200 || empty($response)) {
            $pdo->query("UPDATE sheets_config SET connection_status = 'Error de lectura' WHERE id = 1");
            sendJsonResponse([
                'success' => false,
                'status' => 'Error de lectura',
                'error' => "Google Sheets respondió con código HTTP {$httpCode}. Verifica que el nombre de la pestaña ('{$sheetTab}') exista en el documento."
            ], 400);
        }

        // Parsear CSV
        $lines = explode("\n", trim($response));
        if (count($lines) < 1) {
            sendJsonResponse(['success' => false, 'error' => 'El documento parece estar vacío'], 400);
        }

        $headers = str_getcsv($lines[0]);
        $previewRows = [];
        $maxPreview = min(count($lines), 6);
        for ($i = 1; $i < $maxPreview; $i++) {
            if (!empty(trim($lines[$i]))) {
                $previewRows[] = str_getcsv($lines[$i]);
            }
        }

        $totalRowsDetected = max(0, count($lines) - 1);

        $updateValid = $pdo->prepare("
            UPDATE sheets_config SET 
                connection_status = 'Conexión válida',
                total_detected = ?
            WHERE id = 1
        ");
        $updateValid->execute([$totalRowsDetected]);

        sendJsonResponse([
            'success' => true,
            'status' => 'Conexión válida',
            'message' => "Conexión exitosa. Se detectaron {$totalRowsDetected} registros en la pestaña '{$sheetTab}'.",
            'headers' => $headers,
            'preview_rows' => $previewRows,
            'total_detected' => $totalRowsDetected
        ]);
    }

    // C. Ejecutar sincronización real
    if ($action === 'sync_now') {
        $cfgStmt = $pdo->query("SELECT * FROM sheets_config WHERE id = 1 LIMIT 1");
        $config = $cfgStmt->fetch();
        $sheetUrl = $config['sheet_url'] ?? '';
        $sheetTab = $config['sheet_tab'] ?? 'Hoja 1';

        if (empty($sheetUrl)) {
            sendJsonResponse(['success' => false, 'error' => 'No hay ningún enlace de Google Sheets configurado'], 400);
        }

        if (!preg_match('/spreadsheets\/d\/([a-zA-Z0-9-_]+)/', $sheetUrl, $matches)) {
            sendJsonResponse(['success' => false, 'error' => 'Enlace de Google Sheets no válido'], 400);
        }

        $spreadsheetId = $matches[1];
        $encodedTab = urlencode($sheetTab);
        $csvUrl = "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/gviz/tq?tqx=out:csv&sheet={$encodedTab}";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $csvUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_USERAGENT, 'SHINE-Fragancias-Sync/1.0');
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || empty($response)) {
            $logStmt = $pdo->prepare("INSERT INTO sync_history (status, items_errors, log_details) VALUES ('Error de lectura', 1, ?)");
            $logStmt->execute(["Google Sheets respondió con código HTTP {$httpCode}"]);
            sendJsonResponse(['success' => false, 'error' => 'No se pudo leer el documento para sincronizar'], 400);
        }

        $lines = explode("\n", trim($response));
        if (count($lines) < 2) {
            sendJsonResponse(['success' => false, 'error' => 'No hay filas de datos para sincronizar'], 400);
        }

        $headers = array_map('trim', str_getcsv($lines[0]));
        $mapping = json_decode($config['column_mapping'], true) ?: [
            'name' => 'INSPIRACION (M)',
            'brand' => 'CASA',
            'description' => 'DESCRIPCION',
            'category' => 'CATEGORIA',
            'subcategory' => 'SUBCATEGORIA'
        ];

        // Mapear índices de columnas
        $idxName = array_search($mapping['name'], $headers);
        $idxBrand = array_search($mapping['brand'], $headers);
        $idxDesc = array_search($mapping['description'], $headers);
        $idxCat = array_search($mapping['category'], $headers);
        $idxSubcat = array_search($mapping['subcategory'], $headers);

        $added = 0;
        $updated = 0;
        $skipped = 0;
        $errors = 0;
        $totalDetected = 0;

        for ($i = 1; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            if (empty($line)) continue;
            $row = str_getcsv($line);
            $totalDetected++;

            $name = $idxName !== false && isset($row[$idxName]) ? trim($row[$idxName]) : '';
            $brand = $idxBrand !== false && isset($row[$idxBrand]) ? trim($row[$idxBrand]) : '';
            $desc = $idxDesc !== false && isset($row[$idxDesc]) ? trim($row[$idxDesc]) : '';
            $cat = $idxCat !== false && isset($row[$idxCat]) ? trim($row[$idxCat]) : 'Inspiraciones';
            $subcat = $idxSubcat !== false && isset($row[$idxSubcat]) ? trim($row[$idxSubcat]) : null;

            if (empty($name) || empty($brand)) {
                $errors++;
                continue;
            }

            // Buscar si ya existe por nombre y marca
            $findStmt = $pdo->prepare("SELECT * FROM products WHERE (name = ? OR raw_inspiracion = ?) AND (brand = ? OR raw_casa = ?) LIMIT 1");
            $findStmt->execute([$name, $name, $brand, $brand]);
            $existing = $findStmt->fetch();

            if ($existing) {
                // Si el producto fue editado manualmente por el admin (manual_override = 1),
                // NO sobreescribimos clasificaciones ni imágenes aprobadas.
                if ($existing['manual_override'] == 1) {
                    $skipped++;
                    continue;
                }

                // Si no tiene override, actualizamos campos manteniendo su ID e imagen
                $updStmt = $pdo->prepare("
                    UPDATE products SET 
                        description = COALESCE(NULLIF(?, ''), description),
                        category = COALESCE(NULLIF(?, ''), category),
                        subcategory = COALESCE(NULLIF(?, ''), subcategory),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ");
                $updStmt->execute([$desc, $cat, $subcat, $existing['id']]);
                $updated++;
            } else {
                // Producto nuevo detectado en la hoja
                $newId = 'SHINE-' . strtoupper(substr(uniqid(), -6));
                $insStmt = $pdo->prepare("
                    INSERT INTO products (
                        id, name, brand, raw_inspiracion, raw_casa, description, 
                        category, subcategory, status, manual_override, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'publicado', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ");
                $insStmt->execute([$newId, $name, $brand, $name, $brand, $desc, $cat, $subcat]);
                $added++;
            }
        }

        $syncStatus = ($errors > 0) ? 'Sincronización completada con advertencias' : 'Sincronización completada';

        // Actualizar tabla de configuración
        $updConfig = $pdo->prepare("
            UPDATE sheets_config SET 
                connection_status = ?,
                last_sync_at = CURRENT_TIMESTAMP,
                total_detected = ?,
                total_added = ?,
                total_updated = ?,
                total_skipped = ?,
                total_errors = ?
            WHERE id = 1
        ");
        $updConfig->execute([$syncStatus, $totalDetected, $added, $updated, $skipped, $errors]);

        // Registrar en historial
        $histStmt = $pdo->prepare("
            INSERT INTO sync_history (
                status, items_detected, items_added, items_updated, 
                items_skipped, items_errors, log_details
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $logSummary = "Sincronización finalizada. Detectados: {$totalDetected}, Agregados: {$added}, Actualizados: {$updated}, Omitidos (respetando cambios manuales): {$skipped}, Errores: {$errors}";
        $histStmt->execute([$syncStatus, $totalDetected, $added, $updated, $skipped, $errors, $logSummary]);

        sendJsonResponse([
            'success' => true,
            'status' => $syncStatus,
            'summary' => [
                'total_detected' => $totalDetected,
                'items_added' => $added,
                'items_updated' => $updated,
                'items_skipped' => $skipped,
                'items_errors' => $errors
            ],
            'message' => $logSummary
        ]);
    }

    // D. Desconectar Google Sheets
    if ($action === 'disconnect') {
        $pdo->query("
            UPDATE sheets_config SET 
                sheet_url = NULL, 
                connection_status = 'Sin configurar',
                total_detected = 0
            WHERE id = 1
        ");
        sendJsonResponse([
            'success' => true,
            'message' => 'Conexión con Google Sheets eliminada correctamente'
        ]);
    }
}

sendJsonResponse(['success' => false, 'error' => 'Acción no reconocida'], 400);

