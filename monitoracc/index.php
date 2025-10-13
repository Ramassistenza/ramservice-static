<?php
header("Content-Type: text/html; charset=utf-8");

// Ottiene lista dei file immagine nella cartella
$dir = __DIR__;
$files = array_filter(scandir($dir), function($f) {
    return preg_match('/\.(jpg|jpeg|png|webp)$/i', $f);
});
sort($files);

// Costruzione JSON semplice per JS
$data = [];
foreach ($files as $f) {
    // evita il file index.php stesso
    if (strcasecmp($f, "index.php") === 0) continue;
    $data[] = $f;
}

// Output JSON (solo lista, nessun HTML)
echo json_encode($data);
?>
