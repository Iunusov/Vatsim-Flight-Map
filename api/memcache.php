<?php
namespace memcache;
require_once ('../config.php');

$mc = false;

function memcache()
{
    global $mc;
    if ($mc) return $mc;
    $mc = new \Memcache;
    $mc->connect(MEMCACHE_IP, MEMCACHE_PORT);
    return $mc;
}

function get($key)
{
    return memcache()->get(md5(strtoupper($key)));
}

function set($key, $value)
{
    $flags = 0;
    $key = md5(strtoupper($key));
    if (memcache()->replace($key, $value, $flags, MEMCACHE_EXPIRY_SECONDS) == false)
    {
        return memcache()->set($key, $value, $flags, MEMCACHE_EXPIRY_SECONDS);
    }
    return true;
}

function increment($key, $value = 1)
{
    return memcache()->increment($key, $value);
}
?>
