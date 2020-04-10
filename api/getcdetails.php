<?php
require ('utils.php');

$cid = filter_var($_GET['cid'], FILTER_VALIDATE_INT);
$callsign = $_GET['callsign'];

if ($cid === false || !$callsign) write404();

$timestamp = 0;
$json = getClientDetailsFromMemcache($cid, $callsign, $timestamp);
writeHttpContent($timestamp, $json);
?>
