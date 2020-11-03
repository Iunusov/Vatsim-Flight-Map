#!/usr/bin/php
<?php
php_sapi_name() == "cli" or die("<br><strong>This script is not intended to be runned from web.</strong>" . PHP_EOL);
error_reporting(E_ALL);
ini_set('display_errors', 1);

include ("../config.php");
include ("../api/memcache.php");
include ("../api/db.php");
include ("Airports.php");

define("EOL__", "\n");
define("STATUS_URL_TYPE", count($argv) >= 2 && $argv[1] == "ivao" ? "IVAO" : "VATSIM");
define("SERVERS_LIST", "./" . strtolower(STATUS_URL_TYPE) . "_servers.json");

$airports = new Airports();

function isIvao()
{
    return strcasecmp(STATUS_URL_TYPE, "ivao") == 0;
}

function getServers()
{
    $status_url = isIvao() ? STATUS_URL_IVAO : STATUS_URL_VATSIM;
    if (file_exists(SERVERS_LIST) && (time() - filemtime(SERVERS_LIST)) < 12 * 60 * 60)
    {
        return;
    }
    $content = str_replace("\r\n", "\n", file_get_contents($status_url));
    $servers = false;
    preg_match_all("/" . EOL__ . "url0=(.*)/", $content, $servers);
    if (count(json_decode(json_encode($servers[1]) , true)) <= 0)
    {
        error_log("can't get servers list from " . $status_url);
        die();
    }
    file_put_contents(SERVERS_LIST, json_encode($servers[1]) . PHP_EOL, LOCK_EX);
}

function getLogonTime($str)
{
    if (strlen($str) != 14)
    {
        return "";
    }
    $formatted = substr($str, 0, 4) . ":" . substr($str, 4, 2) . ":" . substr($str, 6, 2) . " " . substr($str, 8, 2) . ":" . substr($str, 10, 2) . ":" . substr($str, 12, 2);
    $logonDateTime = new DateTime("$formatted", new DateTimeZone("UTC"));
    $interval = $logonDateTime->diff(new DateTime(null, new DateTimeZone("UTC")));
    return $interval->format('%d days %h hours %i minutes');
}

function getUsersOnline($str)
{
    $res = preg_match('/CONNECTED CLIENTS = (\d+)/', $str, $users);
    if ($res && is_array($users) && count($users) == 2 && filter_var($users[1], FILTER_VALIDATE_INT))
    {
        return $users[1];
    }
    return false;
}
function parseCreatedTimeStamp($str)
{
    if (!is_string($str))
    {
        error_log('parseCreatedTimeStamp(): str is not string!');
        return false;
    }

    $res = preg_match('/UPDATE = (\d{14})/', $str, $created);

    if (!$res || !is_array($created) || count($created) != 2)
    {
        error_log('preg_match() failed!');
        return false;
    }
    $Y = substr($created[1], 0, 4);
    $m = substr($created[1], 4, 2);
    $d = substr($created[1], 6, 2);
    $h = substr($created[1], 8, 2);
    $i = substr($created[1], 10, 2);
    $s = substr($created[1], 12, 2);
    try
    {
        $obj = DateTime::createFromFormat("d/m/Y H:i:s", "{$d}/{$m}/{$Y} {$h}:{$i}:{$s}", new DateTimeZone('UTC'));
        if (!$obj)
        {
            error_log('createFromFormat() failed!');
            return false;
        }
        return $obj->getTimestamp();
    }
    catch(Exception $e)
    {
        error_log($e->getMessage());
        return false;
    }
}

function toUTF8($str)
{
    if (!((bool)preg_match('//u', $str)))
    {
        $resultUTF8 = utf8_encode($str);
    }
    else
    {
        $resultUTF8 = $str;
    }
    return str_replace(utf8_encode(chr(0x5E) . chr(0xA7)) , "\n", $resultUTF8);
}
function fixArrayEncoding(&$arr)
{
    foreach ($arr as $key => $val)
    {
        $arr[$key] = toUTF8($arr[$key]);
    }
}
function loadServersArray()
{
    return json_decode(file_get_contents(SERVERS_LIST) , true);
}
function addToDB($type, $arr, $timestamp, $users_online)
{
    $clients = array();
    foreach ($arr as $v)
    {
        if ($v["clienttype"] != "ATC" && $v["clienttype"] != "PILOT")
        {
            continue;
        }
        $clients[] = array(
            $v["cid"],
            $v["callsign"],
            $v["clienttype"],
            $v["heading"],
            $v["latitude"],
            $v["longitude"]
        );
        memcache\set($type . $v["cid"] . $v["callsign"], json_encode($v));
        if (json_last_error() != JSON_ERROR_NONE)
        {
            error_log("json_last_error(): " . json_last_error());
            print_r($v);
        }
    }
    $result = array(
        "timestamp" => $timestamp,
        "network" => STATUS_URL_TYPE,
        "online" => $users_online,
        "data" => $clients,
    );
    $json = json_encode($result);
    if (json_last_error() != JSON_ERROR_NONE)
    {
        error_log("json_last_error(): " . json_last_error());
    }
    $res = memcache\set($type . CLIENTS_DATA, $json) && memcache\set($type . CLIENTS_META, array(
        'created_timestamp' => $timestamp,
    ));
    if (!$res)
    {
        error_log('failed to save data to memcache!');
    }
}
function trytoparse($url)
{
    $ivao_tpl = isIvao() ? "; !CLIENTS section -         callsign:cid:realname:clienttype:frequency:latitude:longitude:altitude:groundspeed:planned_aircraft:planned_tascruise:planned_depairport:planned_altitude:planned_destairport:server:protrevision:rating:transponder:facilitytype:visualrange:planned_revision:planned_flighttype:planned_deptime:planned_actdeptime:planned_hrsenroute:planned_minenroute:planned_hrsfuel:planned_minfuel:planned_altairport:planned_remarks:planned_route:unused:unused2:unused3:unused4:atis_message:time_last_atis_received:time_logon:software_name:software_version:administrative_version:atc_pilot_version:planned_altairport2:type_of_flight:persons:heading:on_ground:simulator:\n" : "";

    $clients_container = Array();
    $data = file_get_contents($url);
    $data = $ivao_tpl . str_replace("\r\n", EOL__, $data);

    if (!$data)
    {
        error_log("file_get_contents($url) fails");
        return false;
    }
    $pattern = isIvao() ? "/!CLIENTS\n(.*?)" . EOL__ . "!AIRPORTS" . "/s" : "/!CLIENTS:(.*?)" . EOL__ . ";" . EOL__ . ";" . EOL__ . "/s";
    preg_match($pattern, $data, $clients_container);
    preg_match($pattern, $data, $clients_container);

    if (!isset($clients_container[1]))
    {
        error_log("cannot parse data");
        return false;
    }
    $clients = "";
    $timestamp = parseCreatedTimeStamp($data);
    if (!$timestamp)
    {
        error_log('parseCreatedTimeStamp() fails.');
        return false;
    }
    $timestamp_from_memcache = db\getTimestamp(STATUS_URL_TYPE);
    if ($timestamp && $timestamp_from_memcache && ($timestamp <= $timestamp_from_memcache))
    {
        //error_log('old data, skip');
        return false;
        
    }

    preg_match_all("/(.*?):" . EOL__ . "/", $clients_container[1], $clients);
    if (!isset($clients[1]))
    {
        error_log("cannot parse !CLIENTS container ($url)");
        return false;
    }
    $clients = $clients[1];

    preg_match("/; !CLIENTS section -(.*?):" . EOL__ . "/", $data, $clients_tpl);

    if (!isset($clients_tpl[1]))
    {
        error_log("cannot parse clients_tpl ($url)");
        return false;
    }
    $clients_final = array();
    $tpl_array = explode(":", trim($clients_tpl[1]));

    $tpl_array_without_atis = $tpl_array;
    unset($tpl_array_without_atis[36]);
    unset($tpl_array_without_atis[35]);

    foreach ($clients as $item)
    {
        $cl_array = explode(":", trim($item));
        fixArrayEncoding($cl_array);
        $combined = @array_combine($tpl_array, $cl_array);
        if (!$combined)
        {
            $combined = @array_combine($tpl_array_without_atis, $cl_array);
        }
        if (!$combined || !is_array($combined) || empty($combined))
        {
            error_log("array_combine error");
            continue;
        }
        if ($combined && is_array($combined))
        {
            $combined["planned_remarks"] = wordwrap($combined["planned_remarks"], 40);
            $combined["planned_route"] = wordwrap($combined["planned_route"], 40);
            if (isset($combined["atis_message"])) $combined["atis_message"] = wordwrap($combined["atis_message"], 40);
            $clients_final[] = $combined;
        }
    }

    //get planned_depairport_lat, planned_depairport_lon, planned_destairport_lat, planned_destairport_lon values from the database
    global $airports;
    foreach ($clients_final as $k => $v)
    {
        if (!is_array($v))
        {
            error_log("not an array!");
            continue;
        }
        $dep = false;
        $dest = false;
        if (array_key_exists("planned_depairport", $v) && strlen($v["planned_depairport"]) > 0)
        {
            $dep = $airports->getAirportDetails($v["planned_depairport"]);
        }
        if (array_key_exists("planned_destairport", $v) && strlen($v["planned_destairport"]) > 0)
        {
            $dest = $airports->getAirportDetails($v["planned_destairport"]);
        }
        if ($dep)
        {
            $clients_final[$k]["planned_depairport_lat"] = $dep[6];
            $clients_final[$k]["planned_depairport_lon"] = $dep[7];
            $clients_final[$k]["planned_depairport_name_"] = $dep[1];
            $clients_final[$k]["planned_depairport_country_"] = $dep[3];
            $clients_final[$k]["planned_depairport_city_"] = $dep[2];
            $clients_final[$k]["planned_depairport_id_"] = $dep[0];
        }
        if ($dest)
        {
            $clients_final[$k]["planned_destairport_lat"] = $dest[6];
            $clients_final[$k]["planned_destairport_lon"] = $dest[7];
            $clients_final[$k]["planned_destairport_name_"] = $dest[1];
            $clients_final[$k]["planned_destairport_country_"] = $dest[3];
            $clients_final[$k]["planned_destairport_city_"] = $dest[2];
            $clients_final[$k]["planned_destairport_id_"] = $dest[0];
        }
        if ($v["clienttype"] == "ATC" && ($atc_airport = $airports->getAirportDetails(strtok($v["callsign"], '_'))))
        {
            $clients_final[$k]["atc_airport_name_"] = $atc_airport[1];
            $clients_final[$k]["atc_airport_country_"] = $atc_airport[3];
            $clients_final[$k]["atc_airport_city_"] = $atc_airport[2];
            $clients_final[$k]["atc_airport_icao_"] = $atc_airport[5];
        }
        $clients_final[$k]["timestamp"] = $timestamp;
        $clients_final[$k]["network"] = STATUS_URL_TYPE;
    }
    addToDB(STATUS_URL_TYPE, $clients_final, $timestamp, getUsersOnline($data));
    return true;
}

getServers();
$serversArray = loadServersArray();
if (isIvao())
{
    $serversArray[] = "https://api.ivao.aero/getdata/whazzup/whazzup.txt";
}
else
{
    $serversArray[] = "http://eu.data.vatsim.net/vatsim-data.txt";
}
if (count($serversArray) <= 0)
{
    error_log("loadServersArray() fails!");
    die();
}
shuffle($serversArray);
foreach ($serversArray as $url)
{
    if (trytoparse($url))
    {
        break;
    }
}
exit(0);
?>
