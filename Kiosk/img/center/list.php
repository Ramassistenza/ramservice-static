<?php
$files = glob("*.{jpg,jpeg,png,gif,svg}", GLOB_BRACE);
echo json_encode($files);
?>
