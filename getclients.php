<?php
require("vatsim_parser/config.php");
$m = new Memcache;
$m->connect(MEMCACHE_IP, MEMCACHE_PORT);
$clients = $m->get(md5(MEMCACHE_PREFIX_VATSIM."clients_data"));
$m->close();
if (!$clients) {
    header("HTTP/1.0 404 Not Found");
    die();
}

$last_modified_time = $clients['last_modified'];
$etag  = $clients['md5'];
// always send headers
header("Last-Modified: " . gmdate("D, d M Y H:i:s", $last_modified_time) . " GMT");
header("Etag: $etag");
// exit if not modified
if (@strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) == $last_modified_time || @trim($_SERVER['HTTP_IF_NONE_MATCH']) == $etag) {
    header("HTTP/1.1 304 Not Modified");
    exit;
}
header('Content-type: application/json');
header("Content-length: " . strlen($clients['json']));
header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', $last_modified_time + 60));
echo $clients['json'];
?>
