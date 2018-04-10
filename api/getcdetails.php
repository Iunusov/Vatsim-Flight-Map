<?php
require('../config.php');
header('Content-type: application/json');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + CACHE_LIFETIME_SECONDS));
header('Cache-Control: max-age='.CACHE_LIFETIME_SECONDS.', public');
function exit404($error)
{
    header('HTTP/1.0 404 Not Found');
	$content = "{\"error\": \"$error\"}";
	header('Content-length: ' . strlen($content));
    die($content);
}
$cid = filter_var($_GET['cid'], FILTER_VALIDATE_INT);
if ($cid === FALSE) {
    exit404('cid');
}
$m = new Memcache;
$m->connect(MEMCACHE_IP, MEMCACHE_PORT);
$json = $m->get(md5(MEMCACHE_PREFIX_VATSIM . $cid));
$m->close();
if (!strlen($json)) {
    exit404('not found');
}
header('Content-length: ' . strlen($json));
echo $json;
?>
