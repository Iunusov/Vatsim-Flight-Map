#!/usr/bin/php
<?php
php_sapi_name() == "cli" or die("<br><strong>This script is not intended to be runned from web.</strong>" . PHP_EOL);
define("TARGET_DIR", "../../img/planes/");
$source = imagecreatefrompng("source.png");
imagealphablending($source, false);
imagesavealpha($source, true);
	
if (!file_exists(TARGET_DIR)) {
    mkdir(TARGET_DIR, 0777, true);
}

for($angle = 0; $angle <= 360; $angle+=10){
	$rotation = imagerotate($source, $angle, imageColorAllocateAlpha($source, 0, 0, 0, 127));
	imagealphablending($rotation, false);
	imagesavealpha($rotation, true);
	imagepng($rotation,TARGET_DIR.$angle.'.png');
}
?>
