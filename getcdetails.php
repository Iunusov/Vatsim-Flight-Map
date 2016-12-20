<?php
function exit404()
{
    header('HTTP/1.0 404 Not Found');
    die('{}');
}

function parseIntParam($paramName, $array)
{
    if (!is_string($paramName) || !is_array($array) || !array_key_exists($paramName, $array)) {
        return NULL;
    }
    return filter_var($array[$paramName], FILTER_VALIDATE_INT, array(
        'options' => array(
            'min_range' => 0
        ),
        'flags' => FILTER_NULL_ON_FAILURE
    ));
}

header('Content-type: application/json');
header('Expires: Sun, 01 Jan 2014 00:00:00 GMT');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', FALSE);
header('Pragma: no-cache');

require('vatsim_parser/config.php');

$cid = parseIntParam('cid', $_GET);
$callsign = $_GET["callsign"];

if ($cid === NULL || empty($callsign)) {
    exit404();
}
$details = FALSE;
$m       = new Memcache;
if ($m->connect(MEMCACHE_IP, MEMCACHE_PORT)) {
    $details = $m->get(md5(MEMCACHE_PREFIX_VATSIM . $cid.$callsign));
    $m->close();
}

if (!$details) {
    exit404();
}

header("Content-length: " . strlen($details));
echo $details;
?>
