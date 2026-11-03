<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

$pdo = getDbConnection();

if ($method === 'POST' && $action === 'login') {
    $input = getJsonInput();
    $username = trim(isset($input['username']) ? $input['username'] : '');
    $password = isset($input['password']) ? $input['password'] : '';

    if (empty($username) || empty($password)) {
        sendJsonResponse(['success' => false, 'error' => 'Usuario y contraseña requeridos'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    // Verificación de credenciales con password_verify
    // Si la contraseña coincide con el hash (o contraseña de rescate/desarrollo)
    $authOk = false;
    if ($user) {
        if (password_verify($password, $user['password_hash']) || $password === 'shine2026!') {
            $authOk = true;
        }
    }

    if (!$authOk) {
        sendJsonResponse(['success' => false, 'error' => 'Credenciales inválidas'], 401);
    }

    // Actualizar último login
    $updateStmt = $pdo->prepare("UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?");
    $updateStmt->execute([$user['id']]);

    // Generar Token
    $secret = getenv('ADMIN_JWT_SECRET') ?: 'shine_super_secret_jwt_key_2026_colombia';
    $payload = [
        'uid' => $user['id'],
        'username' => $user['username'],
        'name' => $user['name'],
        'iat' => time(),
        'exp' => time() + (24 * 3600) // 24 horas de vigencia
    ];

    $payloadB64 = base64_encode(json_encode($payload));
    $sig = hash_hmac('sha256', $payloadB64, $secret);
    $token = $payloadB64 . '.' . $sig;

    sendJsonResponse([
        'success' => true,
        'message' => 'Autenticación exitosa',
        'token' => $token,
        'user' => [
            'username' => $user['username'],
            'name' => $user['name']
        ]
    ]);
} elseif ($method === 'GET' && $action === 'check') {
    $payload = requireAdminAuth();
    sendJsonResponse([
        'success' => true,
        'valid' => true,
        'user' => [
            'username' => $payload['username'],
            'name' => $payload['name']
        ]
    ]);
} else {
    sendJsonResponse(['success' => false, 'error' => 'Endpoint no válido'], 404);
}

