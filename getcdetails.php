<?php
function exit404($error)
{
    header('HTTP/1.0 404 Not Found');
	$content = "{\"error\": \"$error\"}";
	header("Content-length: " . strlen($content));
    die($content);
}

header('Content-type: application/json');
header('Expires: Sun, 01 Jan 2014 00:00:00 GMT');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', FALSE);
header('Pragma: no-cache');
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");

require('vatsim_parser/config.php');

$cid = filter_var($_GET["cid"], FILTER_VALIDATE_INT);

if ($cid === FALSE) {
    exit404("cid is empty");
}
$details = FALSE;
$m       = new Memcache;
if ($m->connect(MEMCACHE_IP, MEMCACHE_PORT)) {
    $details = $m->get(md5(MEMCACHE_PREFIX_VATSIM . $cid));
    $m->close();
}

if (!$details) {
    exit404("nof found");
}

header("Content-length: " . strlen($details));
echo $details;
?>
