<?php
header('Content-Type: application/json');

$baseDir = __DIR__; // cartella corrente
$baseUrl = "https://ramservice.altervista.org/Shopify/RAMSERVICE_PRODUCTS/";

$result = [];

foreach (scandir($baseDir) as $sku) {
    if ($sku === '.' || $sku === '..') continue;
    $skuPath = $baseDir . '/' . $sku;
    if (is_dir($skuPath)) {
        $files = [];
        foreach (scandir($skuPath) as $file) {
            if (preg_match('/\.(jpg|jpeg|png)$/i', $file)) {
                $files[] = $baseUrl . $sku . '/' . $file;
            }
        }
        sort($files);
        if (!empty($files)) {
            $result[$sku] = $files;
        }
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);
