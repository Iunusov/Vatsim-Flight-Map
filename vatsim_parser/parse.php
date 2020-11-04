#!/usr/bin/php
<?php
php_sapi_name() == "cli" or die("<br><strong>This script is not intended to be runned from web.</strong>" . PHP_EOL);
error_reporting(E_ALL);
ini_set('display_errors', 1);

include ("../config.php");
include ("../api/memcache.php");
include ("../api/db.php");
include ("Airports.php");

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
    return 0;
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
    preg_match(isIvao() ? IVAO_PATTERN : VATSIM_PATTERN, isIvao() ? IVAO_HEADER : VATSIM_HEADER, $clients_tpl);
    if (!isset($clients_tpl[1]))
    {
        error_log("cannot parse clients_tpl ($url)");
        return false;
    }
    $data = file_get_contents($url);
    if (!$data)
    {
        error_log("file_get_contents($url) fails");
        return false;
    }
    if (getUsersOnline($data) == 0)
    {
        error_log('zero users online');
        return;
    }
    $data = str_replace("\r\n", EOL__, $data);
    $timestamp = parseCreatedTimeStamp($data);
    if (!$timestamp)
    {
        error_log('parseCreatedTimeStamp() fails.');
        return false;
    }
    $timestamp_from_memcache = db\getTimestamp(STATUS_URL_TYPE);
    if ($timestamp && $timestamp_from_memcache && ($timestamp <= $timestamp_from_memcache))
    {
        error_log('old data, skip');
        return false;

    }

    $count = preg_match_all(isIvao() ? IVAO_PATTERN : VATSIM_PATTERN, $data, $clients);

    if (!$count || !isset($clients[1]))
    {
        error_log("cannot parse data (or there is no connected clients to your server)");
        return false;
    }

    $clients_final = Array();

    for ($j = 0;$j < $count;$j++)
    {
        $one_client = Array();
        for ($key = 1;$key < count($clients_tpl);$key++)
        {
            //IVAO: absent atis_message:time_last_atis_received info hack
            if (isIvao() && ($key == 35 || $key == 36) && substr_count($clients[0][$j], ":") == 46)
            {
                continue;
            }
            $one_client[$clients_tpl[$key]] = $clients[$key][$j];
        }

        $one_client["planned_remarks"] = wordwrap($one_client["planned_remarks"], 40);
        $one_client["planned_route"] = wordwrap($one_client["planned_route"], 40);
        if (isset($one_client["atis_message"])) $one_client["atis_message"] = wordwrap($one_client["atis_message"], 40);

        $dep = false;
        $dest = false;
        global $airports;
        if (array_key_exists("planned_depairport", $one_client) && strlen($one_client["planned_depairport"]) > 0)
        {
            $dep = $airports->getAirportDetails($one_client["planned_depairport"]);
        }
        if (array_key_exists("planned_destairport", $one_client) && strlen($one_client["planned_destairport"]) > 0)
        {
            $dest = $airports->getAirportDetails($one_client["planned_destairport"]);
        }
        if ($dep)
        {
            $one_client["planned_depairport_lat"] = $dep[6];
            $one_client["planned_depairport_lon"] = $dep[7];
            $one_client["planned_depairport_name_"] = $dep[1];
            $one_client["planned_depairport_country_"] = $dep[3];
            $one_client["planned_depairport_city_"] = $dep[2];
            $one_client["planned_depairport_id_"] = $dep[0];
        }
        if ($dest)
        {
            $one_client["planned_destairport_lat"] = $dest[6];
            $one_client["planned_destairport_lon"] = $dest[7];
            $one_client["planned_destairport_name_"] = $dest[1];
            $one_client["planned_destairport_country_"] = $dest[3];
            $one_client["planned_destairport_city_"] = $dest[2];
            $one_client["planned_destairport_id_"] = $dest[0];
        }
        if ($one_client["clienttype"] == "ATC" && ($atc_airport = $airports->getAirportDetails(strtok($one_client["callsign"], '_'))))
        {
            $one_client["atc_airport_name_"] = $atc_airport[1];
            $one_client["atc_airport_country_"] = $atc_airport[3];
            $one_client["atc_airport_city_"] = $atc_airport[2];
            $one_client["atc_airport_icao_"] = $atc_airport[5];
        }
        $one_client["timestamp"] = $timestamp;
        $one_client["network"] = STATUS_URL_TYPE;
        $one_client["time_logon"] = getLogonTime($one_client["time_logon"]);

        fixArrayEncoding($one_client);
        $clients_final[] = $one_client;
    }

    addToDB(STATUS_URL_TYPE, $clients_final, $timestamp, getUsersOnline($data));
    return true;
}

$serversArray = array();
if (isIvao() && defined("WHAZZUP_URL_IVAO") && !empty(WHAZZUP_URL_IVAO))
{
    $serversArray[] = WHAZZUP_URL_IVAO;
}
else if (!isIvao() && defined("WHAZZUP_URL_VATSIM") && !empty(WHAZZUP_URL_VATSIM))
{
    $serversArray[] = WHAZZUP_URL_VATSIM;
}
else
{
    getServers();
    $serversArray = loadServersArray();
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
