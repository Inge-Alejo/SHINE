<?php
require_once __DIR__ . '/db.php';

requireAdminAuth();
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. GET: Listar imágenes o productos que requieren atención de imágenes
if ($method === 'GET') {
    if ($action === 'pending') {
        // Productos sin imagen
        $stmt = $pdo->query("SELECT id, name, brand, category, subcategory FROM products WHERE image_url IS NULL OR image_url = '' ORDER BY brand ASC, name ASC");
        $pendingProducts = $stmt->fetchAll();

        // Candidatos o imágenes en revisión
        $candStmt = $pdo->query("SELECT pi.*, p.name as product_name, p.brand as product_brand FROM product_images pi JOIN products p ON pi.product_id = p.id WHERE pi.validation_status IN ('pendiente', 'candidato') ORDER BY pi.id DESC");
        $candidates = $candStmt->fetchAll();

        sendJsonResponse([
            'success' => true,
            'products_without_image' => $pendingProducts,
            'image_candidates' => $candidates
        ]);
    } else {
        // Listado de todas las imágenes registradas
        $productId = isset($_GET['product_id']) ? trim($_GET['product_id']) : '';
        if ($productId) {
            $stmt = $pdo->prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC");
            $stmt->execute([$productId]);
        } else {
            $stmt = $pdo->query("SELECT pi.*, p.name as product_name, p.brand as product_brand FROM product_images pi JOIN products p ON pi.product_id = p.id ORDER BY pi.id DESC LIMIT 100");
        }
        sendJsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
    }
}

// 2. POST: Subida de imagen o actualización de estado
if ($method === 'POST') {
    // A. Subida manual de archivo
    if ($action === 'upload') {
        $productId = isset($_POST['product_id']) ? trim($_POST['product_id']) : '';
        $sourceName = isset($_POST['source_name']) ? trim($_POST['source_name']) : 'Carga Manual Administrador';
        $sourceDomain = isset($_POST['source_domain']) ? trim($_POST['source_domain']) : 'shinefragancias.com';
        $sourceUrl = isset($_POST['source_url']) ? trim($_POST['source_url']) : '';
        $notes = isset($_POST['notes']) ? trim($_POST['notes']) : 'Fotografía real cargada manualmente';

        if (empty($productId)) {
            sendJsonResponse(['success' => false, 'error' => 'Se requiere el ID del producto'], 400);
        }

        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            sendJsonResponse(['success' => false, 'error' => 'No se recibió ningún archivo o hubo un error en la carga'], 400);
        }

        $file = $_FILES['image'];
        $maxSize = 5 * 1024 * 1024; // 5 MB
        if ($file['size'] > $maxSize) {
            sendJsonResponse(['success' => false, 'error' => 'El archivo supera el tamaño máximo permitido de 5 MB'], 400);
        }

        // Validar tipo MIME
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp'
        ];

        if (!array_key_exists($mime, $allowedMimes)) {
            sendJsonResponse(['success' => false, 'error' => 'Formato no permitido. Solo se aceptan JPG, PNG y WebP'], 400);
        }

        $ext = $allowedMimes[$mime];
        $safeName = 'prod_' . preg_replace('/[^a-zA-Z0-9_-]/', '', $productId) . '_' . time() . '.' . $ext;
        $destDir = __DIR__ . '/../uploads/products/';
        if (!is_dir($destDir)) {
            mkdir($destDir, 0755, true);
        }
        $destPath = $destDir . $safeName;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            sendJsonResponse(['success' => false, 'error' => 'Error al guardar la imagen en el servidor'], 500);
        }

        $relativePath = '/uploads/products/' . $safeName;

        // Registrar en product_images
        $insImg = $pdo->prepare("
            INSERT INTO product_images (
                product_id, image_path, source_url, source_domain, 
                source_name, validation_status, is_primary, verification_notes, 
                created_at
            ) VALUES (?, ?, ?, ?, ?, 'validado', 1, ?, CURRENT_TIMESTAMP)
        ");
        $insImg->execute([$productId, $relativePath, $sourceUrl, $sourceDomain, $sourceName, $notes]);

        // Asignar como imagen principal del producto
        $updProd = $pdo->prepare("UPDATE products SET image_url = ?, manual_override = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $updProd->execute([$relativePath, $productId]);

        sendJsonResponse([
            'success' => true,
            'message' => 'Imagen subida y asignada correctamente',
            'image_url' => $relativePath
        ]);
    }

    // B. Aprobar imagen candidata
    if ($action === 'approve') {
        $input = getJsonInput();
        $imageId = isset($input['image_id']) ? intval($input['image_id']) : 0;

        $findImg = $pdo->prepare("SELECT * FROM product_images WHERE id = ?");
        $findImg->execute([$imageId]);
        $img = $findImg->fetch();

        if (!$img) {
            sendJsonResponse(['success' => false, 'error' => 'Registro de imagen no encontrado'], 404);
        }

        // Marcar como validada y principal
        $pdo->prepare("UPDATE product_images SET is_primary = 0 WHERE product_id = ?")->execute([$img['product_id']]);
        $pdo->prepare("UPDATE product_images SET validation_status = 'validado', is_primary = 1 WHERE id = ?")->execute([$imageId]);
        $pdo->prepare("UPDATE products SET image_url = ?, manual_override = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$img['image_path'], $img['product_id']]);

        sendJsonResponse([
            'success' => true,
            'message' => 'Fotografía aprobada y publicada como principal para el perfume'
        ]);
    }

    // C. Rechazar imagen
    if ($action === 'reject') {
        $input = getJsonInput();
        $imageId = isset($input['image_id']) ? intval($input['image_id']) : 0;

        $pdo->prepare("UPDATE product_images SET validation_status = 'rechazado', is_primary = 0 WHERE id = ?")->execute([$imageId]);
        sendJsonResponse(['success' => true, 'message' => 'Imagen marcada como rechazada']);
    }
}

sendJsonResponse(['success' => false, 'error' => 'Acción no válida'], 400);

