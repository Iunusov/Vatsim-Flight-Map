<?php
namespace db;
require_once ('../config.php');
require_once ('memcache.php');

function getDetails($cid, $callsign)
{
    return \memcache\get($cid . $callsign);
}

function getAll()
{
    return \memcache\get(VATSIM_DATA);
}

function getTimestamp()
{
    return (int)\memcache\get(VATSIM_META) ['created_timestamp'];
}
?>
