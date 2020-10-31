<?php
namespace memcache;
require_once ('../config.php');

$mc = false;

function connect()
{
    global $mc;
    $mc = new \Memcache;
    $mc->connect(MEMCACHE_IP, MEMCACHE_PORT);
}

function get($key)
{
    global $mc;
    if (!$mc)
    {
        connect();
    }
    return $mc->get($key);
}

function set($key, $value)
{
    global $mc;
    if (!$mc)
    {
        connect();
    }
    $flags = 0;
    $expiration = CACHE_LIFETIME_SECONDS * 3;
    if ($mc->replace($key, $value, $flags, $expiration) == false)
    {
        return $mc->set($key , $value, $flags, $expiration);
    }
    return true;
}
?>
