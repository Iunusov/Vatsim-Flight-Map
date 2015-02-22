<?php
die();
header('Content-type: image/png');  
$cached = 'cache/'.$_GET['r'].'.png';
if(file_exists($cached)) die(file_get_contents($cached));
$source = imagecreatefrompng("plane.png");
imagealphablending($source, false);
imagesavealpha($source, true);
$rotation = imagerotate($source, $_GET['r'], imageColorAllocateAlpha($source, 0, 0, 0, 127));
imagealphablending($rotation, false);
imagesavealpha($rotation, true);
imagepng($rotation,$cached);
imagepng($rotation);
?>