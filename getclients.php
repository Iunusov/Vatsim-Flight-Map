<?php
require("vatsim_parser/config.php");
$m = new Memcache;
$m->connect(MEMCACHE_IP, MEMCACHE_PORT);
$clients_meta = $m->get(md5(MEMCACHE_PREFIX_VATSIM . MEMCACHE_PREFIX_CLIENTS_DATA . MEMCACHE_PREFIX_META));
if (!$clients_meta) {
    header("HTTP/1.0 404 Not Found");
    $m->close();
    die();
}

$last_modified_time = $clients_meta['last_modified'];
$etag               = $clients_meta['md5'];
// always send headers
header("Last-Modified: " . gmdate('D, d M Y H:i:s \G\M\T', $last_modified_time));
header("Etag: $etag");
// exit if not modified
if (@strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) == $last_modified_time || @trim($_SERVER['HTTP_IF_NONE_MATCH']) == $etag) {
    header("HTTP/1.1 304 Not Modified");
	header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 10));
    $m->close();
    die();
}
$json = $m->get(md5(MEMCACHE_PREFIX_VATSIM . MEMCACHE_PREFIX_CLIENTS_DATA . MEMCACHE_PREFIX_JSON));
$m->close();
header('Content-type: application/json');
header("Content-length: " . strlen($json));
header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', $last_modified_time + 120));
echo $json;
?>
