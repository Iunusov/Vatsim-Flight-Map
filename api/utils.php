<?php
require_once ('../config.php');

function write404($error = "not found")
{
    http_response_code(400);
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T'));
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + CACHE_LIFETIME_SECONDS));
    $error = "{\"error\": \"$error\"}";
    header('Content-type: application/json');
    header('Content-length: ' . strlen($error));
    die($error);
}

function writeHttpContent($timestamp, $json)
{
    if (!strlen($json)) write404();
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T', $timestamp));
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', $timestamp + CACHE_LIFETIME_SECONDS));
    header('Content-type: application/json');
    header('Content-length: ' . strlen($json));
    die($json);
}

function getTimestampFromMemcache(&$m)
{
    return (int)$m->get(md5(MEMCACHE_PREFIX_VATSIM . MEMCACHE_PREFIX_CLIENTS_DATA . MEMCACHE_PREFIX_META)) ["created_timestamp"];
}

function getClientDetailsFromMemcache($cid, $callsign, &$timestamp)
{
    $m = new Memcache;
    $m->connect(MEMCACHE_IP, MEMCACHE_PORT);
    $timestamp = getTimestampFromMemcache($m);
    if (time() - $timestamp > CACHE_LIFETIME_SECONDS) $timestamp = time();
    $json = $m->get(md5(MEMCACHE_PREFIX_VATSIM . $cid . $callsign));
    $m->close();
    return $json;
}

function getClientsFromMemcache(&$timestamp)
{
    $m = new Memcache;
    $m->connect(MEMCACHE_IP, MEMCACHE_PORT);
    $timestamp = getTimestampFromMemcache($m);
    if (time() - $timestamp > CACHE_LIFETIME_SECONDS) $timestamp = time();
    $json = $m->get(md5(MEMCACHE_PREFIX_VATSIM . MEMCACHE_PREFIX_CLIENTS_DATA . MEMCACHE_PREFIX_JSON));
    $m->close();
    return $json;
}
?>
