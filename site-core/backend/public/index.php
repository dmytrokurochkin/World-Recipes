<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/db.php';

session_start([
    'cookie_path' => '/',
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax'
]);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Profile-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function jsonResponse(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function getProfileId(): string
{
    $profileId = $_SERVER['HTTP_X_PROFILE_ID'] ?? '';

    if (!preg_match('/^[a-zA-Z0-9_-]{1,64}$/', $profileId)) {
        jsonResponse(400, [
            'error' => [
                'code' => 'invalid_profile_id',
                'message' => 'X-Profile-Id header is missing or invalid.'
            ]
        ]);
    }

    return $profileId;
}

function getRequestPath(): string
{
    $uriPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (!is_string($uriPath)) {
        return '/';
    }

    return rtrim($uriPath, '/') ?: '/';
}

function readJsonBody(): array
{
    $input = file_get_contents('php://input');
    if ($input === false || $input === '') {
        return [];
    }

    $decoded = json_decode($input, true);
    if (!is_array($decoded)) {
        jsonResponse(400, [
            'error' => [
                'code' => 'invalid_json',
                'message' => 'Request body must be valid JSON.'
            ]
        ]);
    }

    return $decoded;
}

function validateRecipeId(string $recipeId): string
{
    if (!preg_match('/^[0-9]{1,32}$/', $recipeId)) {
        jsonResponse(400, [
            'error' => [
                'code' => 'invalid_recipe_id',
                'message' => 'recipeId must be a numeric string.'
            ]
        ]);
    }

    return $recipeId;
}

function validateUsername(string $username): string
{
    $trimmed = trim($username);

    if (!preg_match('/^[a-zA-Z0-9 _-]{3,40}$/', $trimmed)) {
        jsonResponse(400, [
            'error' => [
                'code' => 'invalid_username',
                'message' => 'username must be 3-40 chars and use letters, numbers, spaces, _ or -.'
            ]
        ]);
    }

    return $trimmed;
}

function ensureProfileExists(PDO $pdo, string $profileId): void
{
    $stmt = $pdo->prepare('SELECT 1 FROM profiles WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $profileId]);

    if (!$stmt->fetchColumn()) {
        jsonResponse(400, [
            'error' => [
                'code' => 'profile_not_found',
                'message' => 'Selected profile does not exist. Register or switch profile first.'
            ]
        ]);
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = getRequestPath();

try {
    $pdo = getDbConnection();

    if ($method === 'GET' && $path === '/api/profiles') {
        $stmt = $pdo->query('SELECT id, username, created_at FROM profiles ORDER BY created_at DESC');
        $rows = $stmt->fetchAll();

        $profiles = array_map(function (array $row): array {
            return [
                'id' => $row['id'],
                'username' => $row['username'],
                'createdAt' => $row['created_at']
            ];
        }, $rows);

        jsonResponse(200, ['profiles' => $profiles]);
    }

    if ($method === 'POST' && $path === '/api/profiles') {
        $body = readJsonBody();
        $username = validateUsername((string)($body['username'] ?? ''));

        $profileId = bin2hex(random_bytes(8));

        try {
            $insertStmt = $pdo->prepare('INSERT INTO profiles (id, username) VALUES (:id, :username)');
            $insertStmt->execute([
                ':id' => $profileId,
                ':username' => $username
            ]);
        } catch (PDOException $exception) {
            $errorMessage = $exception->getMessage();
            if (strpos($errorMessage, 'UNIQUE constraint failed: profiles.username') !== false) {
                jsonResponse(409, [
                    'error' => [
                        'code' => 'username_taken',
                        'message' => 'That username already exists. Choose another one.'
                    ]
                ]);
            }

            jsonResponse(500, [
                'error' => [
                    'code' => 'server_error',
                    'message' => 'Internal server error.'
                ]
            ]);
        }

        jsonResponse(201, [
            'profile' => [
                'id' => $profileId,
                'username' => $username
            ]
        ]);
    }

    if ($method === 'GET' && $path === '/api/theme') {
        jsonResponse(200, ['theme' => $_SESSION['theme'] ?? 'light']);
    }

    if ($method === 'POST' && $path === '/api/theme') {
        $body = readJsonBody();
        $newTheme = ($body['theme'] ?? '') === 'dark' ? 'dark' : 'light';
        $_SESSION['theme'] = $newTheme;
        jsonResponse(200, ['theme' => $newTheme]);
    }

    if ($path === '/api/profiles') {
        jsonResponse(405, [
            'error' => [
                'code' => 'method_not_allowed',
                'message' => 'Method not allowed for this endpoint.'
            ]
        ]);
    }

    $profileId = getProfileId();
    ensureProfileExists($pdo, $profileId);

    if ($method === 'GET' && $path === '/api/profile/favorites') {
        $stmt = $pdo->prepare('SELECT recipe_id, created_at FROM favorites WHERE profile_id = :profile_id ORDER BY created_at DESC');
        $stmt->execute([':profile_id' => $profileId]);
        $rows = $stmt->fetchAll();

        $favorites = array_map(function (array $row): array {
            return [
                'recipeId' => $row['recipe_id'],
                'createdAt' => $row['created_at']
            ];
        }, $rows);

        jsonResponse(200, [
            'profileId' => $profileId,
            'favorites' => $favorites
        ]);
    }

    if ($method === 'POST' && $path === '/api/profile/favorites') {
        $body = readJsonBody();
        $recipeId = validateRecipeId((string)($body['recipeId'] ?? ''));

        $stmt = $pdo->prepare('INSERT OR IGNORE INTO favorites (profile_id, recipe_id) VALUES (:profile_id, :recipe_id)');
        $stmt->execute([
            ':profile_id' => $profileId,
            ':recipe_id' => $recipeId
        ]);

        $selectStmt = $pdo->prepare('SELECT recipe_id, created_at FROM favorites WHERE profile_id = :profile_id AND recipe_id = :recipe_id');
        $selectStmt->execute([
            ':profile_id' => $profileId,
            ':recipe_id' => $recipeId
        ]);
        $favorite = $selectStmt->fetch();

        jsonResponse(201, [
            'ok' => true,
            'favorite' => [
                'recipeId' => $favorite['recipe_id'] ?? $recipeId,
                'createdAt' => $favorite['created_at'] ?? null
            ]
        ]);
    }

    if ($method === 'DELETE' && preg_match('#^/api/profile/favorites/([0-9]{1,32})$#', $path, $matches) === 1) {
        $recipeId = validateRecipeId($matches[1]);

        $stmt = $pdo->prepare('DELETE FROM favorites WHERE profile_id = :profile_id AND recipe_id = :recipe_id');
        $stmt->execute([
            ':profile_id' => $profileId,
            ':recipe_id' => $recipeId
        ]);

        jsonResponse(200, [
            'ok' => true,
            'removed' => $stmt->rowCount() > 0
        ]);
    }

    if ($path === '/api/profile/favorites') {
        jsonResponse(405, [
            'error' => [
                'code' => 'method_not_allowed',
                'message' => 'Method not allowed for this endpoint.'
            ]
        ]);
    }

    if (preg_match('#^/api/profile/favorites/.+$#', $path) === 1) {
        jsonResponse(405, [
            'error' => [
                'code' => 'method_not_allowed',
                'message' => 'Method not allowed for this endpoint.'
            ]
        ]);
    }

    jsonResponse(404, [
        'error' => [
            'code' => 'not_found',
            'message' => 'Endpoint not found.'
        ]
    ]);
} catch (Throwable $exception) {
    jsonResponse(500, [
        'error' => [
            'code' => 'server_error',
            'message' => 'Internal server error.'
        ]
    ]);
}
