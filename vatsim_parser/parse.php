#!/usr/bin/php
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

include("config.php");
include("Airports.php");

function parseCreatedTimeStamp($str)
{
    if (!is_string($str)) {
        error_log('parseCreatedTimeStamp(): str is not string!');
        return false;
    }
    $res = preg_match('/; Created at (\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/', $str, $created);
    if (!$res || !is_array($created) || count($created) != 7) {
        error_log('preg_match() failed!');
        return false;
    }
    try {
        $obj = DateTime::createFromFormat("d/m/Y H:i:s", "{$created[1]}/{$created[2]}/{$created[3]} {$created[4]}:{$created[5]}:{$created[6]}", new DateTimeZone('UTC'));
        
        if (!$obj) {
            error_log('createFromFormat() failed!');
            return false;
        }
        return $obj->getTimestamp();
    }
    catch (Exception $e) {
        error_log($e->getMessage());
        return false;
    }
}

function getCreatedTimeStampFromMemCache()
{
    $m = new Memcache;
    $m->connect(MEMCACHE_IP, MEMCACHE_PORT);
    $clients_data = $m->get("vatmap_clients_data");
    $m->close();
    if (!$clients_data) {
        error_log('failed to get clients_data from memcache');
        return false;
    }
    return $clients_data['vatsim_data_created_timestamp'];
}

function detect_encoding($string)
{
    static $list = array('utf-8', 'windows-1251');
    
    foreach ($list as $item) {
        $sample = @iconv($item, $item, $string);
        if (md5($sample) == md5($string))
            return $item;
    }
    return false;
}

function toUTF8($str)
{
    $resultUTF8 = "";
    $enc        = detect_encoding($str);
    if ($enc) {
        $resultUTF8 = iconv($enc, 'utf-8', $str);
    } else {
        $resultUTF8 = utf8_encode($str);
    }
    return str_replace(utf8_encode(chr(0x5E) . chr(0xA7)), PHP_EOL, $resultUTF8);
}

function fixArrayEncoding(&$arr)
{
    foreach ($arr as $key => $val) {
        $arr[$key] = toUTF8($arr[$key]);
    }
}

function loadServersArray()
{
    return json_decode(file_get_contents("./vatsim_servers.json"), true);
}

function addToDB($arr, $timestamp)
{
    $m = new Memcache;
    $m->connect(MEMCACHE_IP, MEMCACHE_PORT);
    $vatmap_clients_data = array();
    foreach ($arr as $v) {
        if ($v["clienttype"] != "ATC" && $v["clienttype"] != "PILOT") {
            continue;
        }
        $vatmap_clients_data[] = array(
            $v["cid"],
            $v["callsign"],
            $v["clienttype"],
            $v["heading"],
            $v["latitude"],
            $v["longitude"],
            $v["atis_message"]
        );
        
        $m->set("vatmap_client" . $v["cid"], json_encode($v), 0, 60 * 60 * 24); //24 hours expiration
        if (json_last_error() != JSON_ERROR_NONE) {
            error_log("json_last_error(): " . json_last_error());
            print_r($v);
        }
    }
    $json = json_encode($vatmap_clients_data);
    if (json_last_error() != JSON_ERROR_NONE) {
        error_log("json_last_error(): " . json_last_error());
    }
    $res = $m->set("vatmap_clients_data", array(
        'vatmap_clients_json' => $json,
        'vatmap_clients_json_md5' => md5($json),
        'vatmap_clients_json_last_modified' => time(),
        'vatsim_data_created_timestamp' => $timestamp
    ));
    $m->close();
    if (!$res) {
        error_log('failed to save data to memcache!');
    }
}

function trytoparse($url)
{
    $clients_container = Array();
    $data              = file_get_contents($url);
    if (!$data) {
        error_log("file_get_contents($url) fails");
        return false;
    }
    preg_match("/!CLIENTS:(.*)" . PHP_EOL . ";" . PHP_EOL . ";" . PHP_EOL . "!SERVERS:/s", $data, $clients_container);
    
    
    if (!isset($clients_container[1])) {
        error_log("cannot parse data");
        return false;
    }
    $clients   = "";
    $timestamp = parseCreatedTimeStamp($data);
    if (!$timestamp) {
        error_log('parseCreatedTimeStamp() fails.');
        return false;
    }
    $timestamp_from_memcache = getCreatedTimeStampFromMemCache();
    if (!$timestamp_from_memcache) {
        error_log('no timestamp from memcache, skip checking.');
    }
    if ($timestamp && $timestamp_from_memcache && ($timestamp <= $timestamp_from_memcache)) {
        error_log('old data, skip');
        return false;
    }
    
    preg_match_all("/(.*):" . PHP_EOL . "/", $clients_container[1], $clients);
    
    if (!isset($clients[1])) {
        error_log("cannot parse !CLIENTS container ($url)");
        return false;
    }
    
    $clients = $clients[1];
    
    preg_match("/; !CLIENTS section -(.*):" . PHP_EOL . "; !PREFILE/", $data, $clients_tpl);
    
    if (!isset($clients_tpl[1])) {
        error_log("cannot parse clients_tpl ($url)");
        return false;
    }
    
    $clients_final = array();
    $tpl_array     = explode(":", trim($clients_tpl[1]));
    
    foreach ($clients as $key => $item) {
        $keys_diff = substr_count($clients_tpl[1], ":") - substr_count($item, ":");
        for ($i = 0; $i < $keys_diff; $i++) {
            error_log("cl_array was corrected!");
            $item .= ":";
        }
        $cl_array = explode(":", trim($item));
        fixArrayEncoding($cl_array);
        $clients_final[$key] = array_combine($tpl_array, $cl_array);
        if (!is_array($clients_final[$key])) {
            error_log("array_combine() failed!");
            error_log("count(tpl_array): " . count($tpl_array));
            error_log("count(cl_array): " . count($cl_array));
        }
    }
    
    //get planned_depairport_lat, planned_depairport_lon, planned_destairport_lat, planned_destairport_lon values from the database
    $airports = new Airports();
    foreach ($clients_final as $k => $v) {
        if (!is_array($v)) {
            error_log("not an array!");
            continue;
        }
        $dep  = false;
        $dest = false;
        if (array_key_exists("planned_depairport", $v) && strlen($v["planned_depairport"]) > 0) {
            $dep = $airports->getAirportDetails($v["planned_depairport"]);
        }
        if (array_key_exists("planned_destairport", $v) && strlen($v["planned_destairport"]) > 0) {
            $dest = $airports->getAirportDetails($v["planned_destairport"]);
        }
        if ($dep) {
            $clients_final[$k]["planned_depairport_lat"] = $dep[6];
            $clients_final[$k]["planned_depairport_lon"] = $dep[7];
        }
        if ($dest) {
            $clients_final[$k]["planned_destairport_lat"] = $dest[6];
            $clients_final[$k]["planned_destairport_lon"] = $dest[7];
        }
    }
    
    addToDB($clients_final, $timestamp);
    
    return true;
}

$serversArray = loadServersArray();

if (count($serversArray) <= 0) {
    error_log("loadServersArray() fails!");
    die();
}

shuffle($serversArray);

foreach ($serversArray as $url) {
    if (trytoparse($url)) {
        break;
    }
}

exit(0);

?>
