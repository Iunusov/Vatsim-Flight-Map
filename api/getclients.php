<?php
require('../config.php');
function exit404($error)
{
    header('HTTP/1.0 404 Not Found');
	$content = "{\"error\": \"$error\"}";
	header('Content-length: ' . strlen($content));
    die($content);
}
$m = new Memcache;
$m->connect(MEMCACHE_IP, MEMCACHE_PORT);
$timestamp = (int)$m->get(md5(MEMCACHE_PREFIX_VATSIM . MEMCACHE_PREFIX_CLIENTS_DATA . MEMCACHE_PREFIX_META))["created_timestamp"];
if(time() - $timestamp > CACHE_LIFETIME_SECONDS){
  $timestamp = time();
}
$json = $m->get(md5(MEMCACHE_PREFIX_VATSIM . MEMCACHE_PREFIX_CLIENTS_DATA . MEMCACHE_PREFIX_JSON));
$m->close();
if(!strlen($json)){
	exit404('not found');
}
header('Content-type: application/json');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T', $timestamp));
header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', $timestamp + CACHE_LIFETIME_SECONDS));
header('Content-length: ' . strlen($json));
echo $json;
?>
