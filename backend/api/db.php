<?php
/**
 * SHINE Fragancias - Conexión de Base de Datos y Utilidades Comunes
 * Compatible con Latinoamérica Hosting Colombia Plan H1 (cPanel / Apache / PHP 7.4 - 8.3)
 */

// Headers de seguridad y CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");
header("X-XSS-Protection: 1; mode=block");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Cargar variables de entorno sencillas si existe .env
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($k, $v) = array_pad(explode('=', $line, 2), 2, null);
        if ($k && $v !== null) {
            putenv(trim($k) . "=" . trim($v));
            $_ENV[trim($k)] = trim($v);
        }
    }
}

function getDbConnection() {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dbType = getenv('DB_TYPE') ?: 'sqlite';

    try {
        if ($dbType === 'mysql') {
            $host = getenv('DB_HOST') ?: 'localhost';
            $dbname = getenv('DB_NAME') ?: 'shine_fragancias';
            $user = getenv('DB_USER') ?: 'root';
            $pass = getenv('DB_PASS') ?: '';
            $port = getenv('DB_PORT') ?: '3306';
            $charset = 'utf8mb4';

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $pdo = new PDO($dsn, $user, $pass, $options);
        } else {
            // SQLite por defecto (portabilidad inmediata sin configuración extra)
            $dbPath = __DIR__ . '/../data/shine.db';
            $dsn = "sqlite:" . $dbPath;
            $pdo = new PDO($dsn, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            $pdo->exec('PRAGMA foreign_keys = ON;');
        }
    } catch (PDOException $e) {
        sendJsonResponse([
            'success' => false,
            'error' => 'Error de conexión a la base de datos',
            'details' => $e->getMessage()
        ], 500);
    }

    return $pdo;
}

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Validación de Token simple y seguro para Admin
function requireAdminAuth() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        sendJsonResponse([
            'success' => false,
            'error' => 'No autorizado. Se requiere token de administrador.'
        ], 401);
    }

    $token = $matches[1];
    $validTokenSecret = getenv('ADMIN_JWT_SECRET') ?: 'shine_super_secret_jwt_key_2026_colombia';
    
    // El token es base64(payload).signature
    $parts = explode('.', $token);
    if (count($parts) !== 2) {
        sendJsonResponse(['success' => false, 'error' => 'Token con formato inválido'], 401);
    }

    list($payloadB64, $signature) = $parts;
    $expectedSignature = hash_hmac('sha256', $payloadB64, $validTokenSecret);
    if (!hash_equals($expectedSignature, $signature)) {
        sendJsonResponse(['success' => false, 'error' => 'Firma de autenticación inválida'], 401);
    }

    $payload = json_decode(base64_decode($payloadB64), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        sendJsonResponse(['success' => false, 'error' => 'Sesión expirada. Inicie sesión nuevamente.'], 401);
    }

    return $payload;
}

