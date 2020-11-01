<?php
namespace db;
require_once ('../config.php');
require_once ('memcache.php');

function getDetails($type, $cid, $callsign)
{
    return \memcache\get($type . $cid . $callsign);
}

function getAll($type)
{
    return \memcache\get($type . CLIENTS_DATA);
}

function getTimestamp($type)
{
    return (int)\memcache\get($type . CLIENTS_META) ['created_timestamp'];
}
?>
