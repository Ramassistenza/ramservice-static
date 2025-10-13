<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

// Percorso della cartella con i media
$path = __DIR__ . '/Media';
$baseUrl = 'https://ramservice.altervista.org/Monitor/Media/';

// Estensioni consentite
$allowed = ['jpg', 'jpeg', 'png', 'mp4', 'webm'];

// Se la cartella non esiste
if (!is_dir($path)) {
    echo json_encode(['error' => 'Cartella non trovata', 'path' => $path]);
    exit;
}

// Elenco file
$files = [];
foreach (scandir($path) as $f) {
    if ($f[0] === '.') continue;
    $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
    if (in_array($ext, $allowed)) $files[] = ['src' => $f];
}
sort($files);

echo json_encode([
    'baseUrl' => $baseUrl,
    'items' => $files
], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
?>
