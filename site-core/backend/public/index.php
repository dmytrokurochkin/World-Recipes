<?php

require_once __DIR__ . '/../src/db.php';

// Setup basic session
session_start([
    'cookie_path' => '/',
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax'
]);

// Headers to tell the browser this is a JSON API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Profile-Id');

// Handle browser's preflight (OPTIONS) request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Helper to send JSON responses easily
function jsonResponse($statusCode, $data) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Helper to read JSON sent by the frontend
function readJsonBody() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: [];
}

// Find out which URL the user visited
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = rtrim($path, '/') ?: '/';

// Connect to database
$pdo = getDbConnection();

// ENDPOINT: Profile List
if ($path === '/api/profiles') {
    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT id, username, created_at FROM profiles ORDER BY created_at DESC');
        $profiles = [];
        
        while ($row = $stmt->fetch()) {
            $profiles[] = [
                'id' => $row['id'],
                'username' => $row['username'],
                'createdAt' => $row['created_at']
            ];
        }

        jsonResponse(200, ['profiles' => $profiles]);
    }

    if ($method === 'POST') {
        $body = readJsonBody();
        $username = trim($body['username'] ?? '');

        if (strlen($username) < 3) {
            jsonResponse(400, ['error' => 'Username too short']);
        }

        // Generate a random ID for the user
        $profileId = bin2hex(random_bytes(8));

        try {
            $stmt = $pdo->prepare('INSERT INTO profiles (id, username) VALUES (:id, :username)');
            $stmt->execute(['id' => $profileId, 'username' => $username]);
        } catch (Exception $e) {
            jsonResponse(409, ['error' => 'Username already taken']);
        }

        jsonResponse(201, [
            'profile' => [
                'id' => $profileId,
                'username' => $username
            ]
        ]);
    }
}

// ENDPOINT: Theme (Light/Dark)
if ($path === '/api/theme') {
    if ($method === 'GET') {
        $theme = $_SESSION['theme'] ?? 'light';
        jsonResponse(200, ['theme' => $theme]);
    }

    if ($method === 'POST') {
        $body = readJsonBody();
        $newTheme = ($body['theme'] === 'dark') ? 'dark' : 'light';
        $_SESSION['theme'] = $newTheme;
        jsonResponse(200, ['theme' => $newTheme]);
    }
}

$profileId = $_SERVER['HTTP_X_PROFILE_ID'] ?? '';

// ENDPOINT: Favorites
if ($path === '/api/profile/favorites') {
    if (!$profileId) {
        jsonResponse(400, ['error' => 'Missing profile ID']);
    }

    if ($method === 'GET') {
        $stmt = $pdo->prepare('SELECT recipe_id, created_at FROM favorites WHERE profile_id = :profile_id ORDER BY created_at DESC');
        $stmt->execute(['profile_id' => $profileId]);
        
        $favorites = [];
        while ($row = $stmt->fetch()) {
            $favorites[] = [
                'recipeId' => $row['recipe_id'],
                'createdAt' => $row['created_at']
            ];
        }

        jsonResponse(200, [
            'profileId' => $profileId,
            'favorites' => $favorites
        ]);
    }

    if ($method === 'POST') {
        $body = readJsonBody();
        $recipeId = strval($body['recipeId'] ?? '');

        if (!$recipeId) {
            jsonResponse(400, ['error' => 'Missing recipe ID']);
        }

        $stmt = $pdo->prepare('INSERT OR IGNORE INTO favorites (profile_id, recipe_id) VALUES (:profile_id, :recipe_id)');
        $stmt->execute([
            'profile_id' => $profileId,
            'recipe_id' => $recipeId
        ]);

        jsonResponse(201, ['ok' => true, 'favorite' => ['recipeId' => $recipeId]]);
    }
}

// ENDPOINT: Delete Favorite
if ($method === 'DELETE' && str_starts_with($path, '/api/profile/favorites/')) {
    if (!$profileId) {
        jsonResponse(400, ['error' => 'Missing profile ID']);
    }

    // Extract the recipe ID from the URL (e.g. /api/profile/favorites/123 -> 123)
    $recipeId = basename($path);

    $stmt = $pdo->prepare('DELETE FROM favorites WHERE profile_id = :profile_id AND recipe_id = :recipe_id');
    $stmt->execute([
        'profile_id' => $profileId,
        'recipe_id' => $recipeId
    ]);

    jsonResponse(200, ['ok' => true]);
}

// If no endpoint matched
jsonResponse(404, ['error' => 'Endpoint not found']);

