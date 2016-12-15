#!/usr/bin/php
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

include("config.php");
include("Airports.php");

function toUTF8($str)
{
    return utf8_encode(str_replace(chr(0x5E) . chr(0xA7), PHP_EOL, $str));
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

function addToDB($arr)
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
        
        $m->set("vatmap_client" . $v["cid"], json_encode($v), 0, 60 * 30); //30 min expiration
        if (json_last_error() != JSON_ERROR_NONE) {
            error_log("json_last_error(): " . json_last_error());
            print_r($v);
        }
    }
    $json = json_encode($vatmap_clients_data);
    if (json_last_error() != JSON_ERROR_NONE) {
        error_log("json_last_error(): " . json_last_error());
    }
    $m->set("vatmap_clients_data", array(
        'vatmap_clients_json' => $json,
        'vatmap_clients_json_md5' => md5($json),
        'vatmap_clients_json_last_modified' => time()
    ));
    $m->close();
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
    $clients = "";
    
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
        $cl_array = explode(":", trim($item));
        fixArrayEncoding($cl_array);
        $clients_final[$key] = array_combine($tpl_array, $cl_array);
    }
    
    //get planned_depairport_lat, planned_depairport_lon, planned_destairport_lat, planned_destairport_lon values from the database
    $airports = new Airports();
    foreach ($clients_final as $k => $v) {
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
    
    addToDB($clients_final);
    
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
