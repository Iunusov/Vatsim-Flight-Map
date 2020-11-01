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
    $key = md5(strtoupper($key));
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
    $key = md5(strtoupper($key));
    if ($mc->replace($key, $value, $flags, MEMCACHE_EXPIRY_SECONDS) == false)
    {
        return $mc->set($key, $value, $flags, MEMCACHE_EXPIRY_SECONDS);
    }
    return true;
}
?>
