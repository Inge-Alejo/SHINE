<?php
require_once __DIR__ . '/db.php';

requireAdminAuth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendJsonResponse(['success' => false, 'error' => 'Método no permitido'], 405);
}

$apiKey = getenv('GEMINI_API_KEY');
if (empty($apiKey)) {
    sendJsonResponse([
        'success' => false,
        'error' => 'La clave de Gemini API no está configurada en el servidor.',
        'hint' => 'Agrega GEMINI_API_KEY en el archivo backend/.env para habilitar la asistencia de inteligencia artificial.'
    ], 503);
}

$input = getJsonInput();
$action = isset($input['action']) ? $input['action'] : 'enrich_notes';
$productName = isset($input['name']) ? trim($input['name']) : '';
$productBrand = isset($input['brand']) ? trim($input['brand']) : '';

if (empty($productName) || empty($productBrand)) {
    sendJsonResponse(['success' => false, 'error' => 'Nombre y marca del perfume requeridos'], 400);
}

// Endpoint de Gemini API
$model = "gemini-1.5-flash";
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

$prompt = "Eres un maestro perfumista de SHINE Fragancias. Describe en español, con estilo elegante, conciso y profesional (máximo 3 frases), las notas de salida, corazón y fondo y la familia olfativa de este perfume: Perfume: {$productName}, Casa: {$productBrand}. Devuelve solo el texto descriptivo.";

$body = [
    "contents" => [
        [
            "parts" => [
                ["text" => $prompt]
            ]
        ]
    ],
    "generationConfig" => [
        "temperature" => 0.4,
        "maxOutputTokens" => 250
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || empty($response)) {
    sendJsonResponse(['success' => false, 'error' => "Error al consultar Gemini API (Código {$httpCode})"], 500);
}

$resData = json_decode($response, true);
$generatedText = $resData['candidates'][0]['content']['parts'][0]['text'] ?? '';

sendJsonResponse([
    'success' => true,
    'generated_description' => trim($generatedText),
    'perfume' => $productName,
    'brand' => $productBrand
]);

