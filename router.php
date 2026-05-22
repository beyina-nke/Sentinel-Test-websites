<?php
declare(strict_types=1);

$root = __DIR__;
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($path === '/api/altcha/challenge') {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        http_response_code(405);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Method not allowed']);
        return true;
    }

    $salt = bin2hex(random_bytes(16));
    $number = random_int(0, 5000);
    $challenge = hash('sha256', $salt . $number);
    $secret = 'dev-altcha-secret';

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'algorithm' => 'SHA-256',
        'challenge' => $challenge,
        'salt' => $salt,
        'signature' => hash_hmac('sha256', $challenge, $secret),
        'maxnumber' => 100000,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    return true;
}

$filePath = realpath($root . ($path === '/' ? '/index.html' : $path));

if ($filePath && str_starts_with($filePath, $root) && is_file($filePath)) {
    return false;
}

http_response_code(404);
echo 'Not found';
return true;
