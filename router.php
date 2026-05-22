<?php
declare(strict_types=1);

$root = __DIR__;
$dataDir = $root . '/data';
$submissionsFile = $dataDir . '/submissions.json';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

function send_json(mixed $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}

function read_json_file(string $path): array
{
    if (!file_exists($path)) {
        return [];
    }

    $contents = file_get_contents($path);
    $decoded = json_decode($contents ?: '[]', true);

    return is_array($decoded) ? $decoded : [];
}

function write_json_file(string $path, array $payload): void
{
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }

    file_put_contents(
        $path,
        json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
        LOCK_EX
    );
}

if ($path === '/api/altcha/challenge' || $path === '/altcha-lab/api/altcha/challenge') {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        send_json(['error' => 'Method not allowed.'], 405);
        return true;
    }

    $salt = bin2hex(random_bytes(16));
    $number = random_int(0, 5000);
    $challenge = hash('sha256', $salt . $number);
    $secret = 'dev-altcha-secret';

    send_json([
        'algorithm' => 'SHA-256',
        'challenge' => $challenge,
        'salt' => $salt,
        'signature' => hash_hmac('sha256', $challenge, $secret),
        'maxnumber' => 100000,
    ]);
    return true;
}

if ($path === '/api/submissions') {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        send_json(read_json_file($submissionsFile));
        return true;
    }

    if ($method === 'POST') {
        $body = json_decode(file_get_contents('php://input') ?: '{}', true);

        if (!is_array($body)) {
            send_json(['error' => 'Invalid JSON body.'], 400);
            return true;
        }

        $submission = [
            'id' => $body['id'] ?? ('submission-' . time() . '-' . bin2hex(random_bytes(4))),
            'provider' => $body['provider'] ?? 'captcha',
            'site' => $body['site'] ?? 'Untitled page',
            'page' => $body['page'] ?? '/',
            'createdAt' => $body['createdAt'] ?? gmdate('c'),
            'fields' => is_array($body['fields'] ?? null) ? $body['fields'] : [],
        ];

        $submissions = read_json_file($submissionsFile);
        array_unshift($submissions, $submission);
        write_json_file($submissionsFile, array_slice($submissions, 0, 100));

        send_json($submission, 201);
        return true;
    }

    if ($method === 'DELETE') {
        write_json_file($submissionsFile, []);
        send_json(['ok' => true]);
        return true;
    }

    send_json(['error' => 'Method not allowed.'], 405);
    return true;
}

$filePath = realpath($root . ($path === '/' ? '/index.html' : $path));

if ($filePath && str_starts_with($filePath, $root) && is_file($filePath)) {
    return false;
}

http_response_code(404);
echo 'Not found';
return true;
