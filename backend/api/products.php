<?php
require_once __DIR__ . '/db.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Manejo de métodos sobreescritos si viene por POST con _method
if ($method === 'POST' && isset($_GET['_method'])) {
    $method = strtoupper($_GET['_method']);
}

// 1. GET - Obtener productos o producto individual
if ($method === 'GET') {
    // Si se consulta un ID individual
    if (isset($_GET['id'])) {
        $id = trim($_GET['id']);
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $prod = $stmt->fetch();

        if (!$prod) {
            sendJsonResponse(['success' => false, 'error' => 'Producto no encontrado'], 404);
        }

        // Obtener imágenes asociadas
        $imgStmt = $pdo->prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC");
        $imgStmt->execute([$id]);
        $prod['images'] = $imgStmt->fetchAll();

        sendJsonResponse(['success' => true, 'data' => $prod]);
    }

    // Filtros para listado
    $where = [];
    $params = [];

    // Categoría
    if (!empty($_GET['category'])) {
        $where[] = "category = ?";
        $params[] = trim($_GET['category']);
    }

    // Subcategoría
    if (!empty($_GET['subcategory'])) {
        if ($_GET['subcategory'] === 'pendiente' || $_GET['subcategory'] === 'null') {
            $where[] = "subcategory IS NULL";
        } else {
            $where[] = "subcategory = ?";
            $params[] = trim($_GET['subcategory']);
        }
    }

    // Marca / Casa
    if (!empty($_GET['brand'])) {
        $where[] = "brand = ?";
        $params[] = trim($_GET['brand']);
    }

    // Género
    if (!empty($_GET['gender'])) {
        $where[] = "gender = ?";
        $params[] = trim($_GET['gender']);
    }

    // Estado (por defecto 'publicado', salvo si se pide explícitamente o si es admin)
    if (!empty($_GET['status'])) {
        if ($_GET['status'] !== 'all') {
            $where[] = "status = ?";
            $params[] = trim($_GET['status']);
        }
    } else {
        $where[] = "status = 'publicado'";
    }

    // Búsqueda textual (en name, brand, description, olfactory_family, raw_inspiracion)
    if (!empty($_GET['search'])) {
        $term = '%' . trim($_GET['search']) . '%';
        $where[] = "(name LIKE ? OR brand LIKE ? OR description LIKE ? OR olfactory_family LIKE ? OR raw_inspiracion LIKE ?)";
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    $whereClause = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

    // Conteo total para paginación
    $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM products {$whereClause}");
    $countStmt->execute($params);
    $totalCount = intval($countStmt->fetch()['total']);

    // Ordenamiento
    $sort = isset($_GET['sort']) ? $_GET['sort'] : 'brand_asc';
    $orderClause = "ORDER BY brand ASC, name ASC";
    if ($sort === 'name_asc') $orderClause = "ORDER BY name ASC";
    if ($sort === 'name_desc') $orderClause = "ORDER BY name DESC";
    if ($sort === 'brand_desc') $orderClause = "ORDER BY brand DESC";
    if ($sort === 'newest') $orderClause = "ORDER BY created_at DESC";

    // Paginación
    $limit = isset($_GET['limit']) ? max(1, min(500, intval($_GET['limit']))) : 500;
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $offset = ($page - 1) * $limit;

    $query = "SELECT * FROM products {$whereClause} {$orderClause} LIMIT {$limit} OFFSET {$offset}";
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    // Listado de marcas disponibles para filtros dinámicos
    $brandsStmt = $pdo->query("SELECT DISTINCT brand FROM products WHERE status = 'publicado' ORDER BY brand ASC");
    $allBrands = $brandsStmt->fetchAll(PDO::FETCH_COLUMN);

    sendJsonResponse([
        'success' => true,
        'total' => $totalCount,
        'page' => $page,
        'limit' => $limit,
        'count' => count($products),
        'brands' => $allBrands,
        'data' => $products
    ]);
}

// 2. POST - Crear producto nuevo (Admin)
elseif ($method === 'POST') {
    $admin = requireAdminAuth();
    $input = getJsonInput();

    $name = trim(isset($input['name']) ? $input['name'] : '');
    $brand = trim(isset($input['brand']) ? $input['brand'] : '');
    $category = trim(isset($input['category']) ? $input['category'] : 'Inspiraciones');
    $subcategory = !empty($input['subcategory']) ? trim($input['subcategory']) : null;
    $description = isset($input['description']) ? trim($input['description']) : '';
    $olfactoryFamily = isset($input['olfactory_family']) ? trim($input['olfactory_family']) : '';
    $gender = isset($input['gender']) ? trim($input['gender']) : 'Unisex';
    $imageUrl = isset($input['image_url']) ? trim($input['image_url']) : null;
    $status = isset($input['status']) ? trim($input['status']) : 'publicado';

    if (empty($name) || empty($brand)) {
        sendJsonResponse(['success' => false, 'error' => 'Nombre y marca son campos obligatorios'], 400);
    }

    // Generar ID único estable
    $id = isset($input['id']) && !empty($input['id']) ? trim($input['id']) : 'SHINE-' . strtoupper(substr(uniqid(), -6));

    $stmt = $pdo->prepare("
        INSERT INTO products (
            id, name, brand, raw_inspiracion, raw_casa, description, 
            olfactory_family, gender, category, subcategory, image_url, 
            status, manual_override, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ");

    $stmt->execute([
        $id, $name, $brand, $name, $brand, $description,
        $olfactoryFamily, $gender, $category, $subcategory, $imageUrl,
        $status
    ]);

    // Registrar en audit log
    $logStmt = $pdo->prepare("INSERT INTO audit_log (entity_type, entity_id, action, user, details) VALUES ('product', ?, 'create', ?, ?)");
    $logStmt->execute([$id, $admin['username'], "Creado producto {$name} ({$brand})"]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Producto creado con éxito',
        'data' => ['id' => $id, 'name' => $name, 'brand' => $brand]
    ], 201);
}

// 3. PUT - Actualizar producto (Admin)
elseif ($method === 'PUT') {
    $admin = requireAdminAuth();
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    $input = getJsonInput();

    if (empty($id)) {
        sendJsonResponse(['success' => false, 'error' => 'ID de producto requerido'], 400);
    }

    // Verificar existencia
    $checkStmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $checkStmt->execute([$id]);
    $current = $checkStmt->fetch();
    if (!$current) {
        sendJsonResponse(['success' => false, 'error' => 'Producto no encontrado'], 404);
    }

    $name = isset($input['name']) ? trim($input['name']) : $current['name'];
    $brand = isset($input['brand']) ? trim($input['brand']) : $current['brand'];
    $category = isset($input['category']) ? trim($input['category']) : $current['category'];
    $subcategory = array_key_exists('subcategory', $input) ? $input['subcategory'] : $current['subcategory'];
    $description = isset($input['description']) ? trim($input['description']) : $current['description'];
    $olfactoryFamily = isset($input['olfactory_family']) ? trim($input['olfactory_family']) : $current['olfactory_family'];
    $gender = isset($input['gender']) ? trim($input['gender']) : $current['gender'];
    $imageUrl = array_key_exists('image_url', $input) ? $input['image_url'] : $current['image_url'];
    $status = isset($input['status']) ? trim($input['status']) : $current['status'];

    $stmt = $pdo->prepare("
        UPDATE products SET 
            name = ?, brand = ?, category = ?, subcategory = ?, 
            description = ?, olfactory_family = ?, gender = ?, 
            image_url = ?, status = ?, manual_override = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");

    $stmt->execute([
        $name, $brand, $category, $subcategory,
        $description, $olfactoryFamily, $gender,
        $imageUrl, $status, $id
    ]);

    // Registrar en audit log
    $logStmt = $pdo->prepare("INSERT INTO audit_log (entity_type, entity_id, action, user, details) VALUES ('product', ?, 'update', ?, ?)");
    $logStmt->execute([$id, $admin['username'], "Actualizado manualmente producto {$name}"]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Producto actualizado correctamente',
        'data' => ['id' => $id, 'name' => $name, 'category' => $category, 'subcategory' => $subcategory]
    ]);
}

// 4. DELETE - Eliminar producto (Admin)
elseif ($method === 'DELETE') {
    $admin = requireAdminAuth();
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';

    if (empty($id)) {
        sendJsonResponse(['success' => false, 'error' => 'ID de producto requerido'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$id]);

    $logStmt = $pdo->prepare("INSERT INTO audit_log (entity_type, entity_id, action, user, details) VALUES ('product', ?, 'delete', ?, ?)");
    $logStmt->execute([$id, $admin['username'], "Eliminado producto {$id}"]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Producto eliminado correctamente'
    ]);
} else {
    sendJsonResponse(['success' => false, 'error' => 'Método no permitido'], 405);
}

