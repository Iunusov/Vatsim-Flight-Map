#!/usr/local/bin/php-cli
<?php
if(!(php_sapi_name() === 'cli')) die("not cli!".PHP_EOL);
function errHandle($errNo, $errStr, $errFile, $errLine) {
    $msg = "$errStr in $errFile on line $errLine";
    if ($errNo == E_NOTICE || $errNo == E_WARNING) {
        throw new ErrorException($msg, $errNo);
    } else {
        die($msg.PHP_EOL);
    }
}
ini_set('display_startup_errors', 1);
ini_set('display_errors', 1);
error_reporting(-1);
set_error_handler('errHandle');
ini_set('default_socket_timeout', 30); 

$arUrl = array(
    "http://www.pcflyer.net/DataFeed/vatsim-data.txt",
    "http://fsproshop.com/servinfo/vatsim-data.txt",
    "http://info.vroute.net/vatsim-data.txt",
    "http://data.vattastic.com/vatsim-data.txt",
    "http://vatsim.aircharts.org/vatsim-data.txt"
);

shuffle($arUrl);

$data = false;

foreach ($arUrl as $url) {
    $data = @file_get_contents($url);
    if (!$data || !strpos($data, "!CLIENTS:")) {
		$data = false;
        continue;
    } else {
        break;
    }
}
if (!$data) {
    die("error during downloading vatsim-data.txt".PHP_EOL);
}

preg_match("/!CLIENTS:(.*)" . PHP_EOL . ";" . PHP_EOL . ";" . PHP_EOL . "!SERVERS:/s", $data, $clients);

if (!isset($clients[1])) {
    die("cannot parse !CLIENTS".PHP_EOL);
}

preg_match_all("/(.*):" . PHP_EOL . "/", $clients[1], $clients);

if (!isset($clients[1])) {
    die("cannot parse !CLIENTS container".PHP_EOL);
}

$clients = $clients[1];

preg_match("/!CLIENTS section -(.*):" . PHP_EOL . "; !PREFILE/", $data, $clients_tpl);

if (!isset($clients_tpl[1])) {
    die("cannot parse clients_tpl".PHP_EOL);
}


$clients_final = array();

foreach ($clients as $key => $item) {
    $clients_final[$key] = array_combine(explode(":", trim($clients_tpl[1])), explode(":", $item));
    foreach ($clients_final[$key] as $k => $v) {
        if ($k == "atis_message" && $clients_final[$key][$k])
            $clients_final[$key][$k] = htmlentities($clients_final[$key][$k]);
        if ($v === "" || in_array($k, array(
            //"time_logon",
            "rating",
			"protrevision",
			"server",
            "planned_destairport_lon",
            "planned_destairport_lat",
			"planned_revision",
            "planned_depairport_lon",
            "planned_depairport_lat",
			"planned_flighttype",
			"atis_message",
			"planned_actdeptime"
        ))) {
            unset($clients_final[$key][$k]);
        }
    }
}

if (!count($clients_final)) {
	die("count(clients_final) = 0".PHP_EOL);
}

$result_json = false;

$result_json = json_encode($clients_final);

if (!$result_json) {
	die("json_encode fails".PHP_EOL);
}

$res = false;

$res = file_put_contents("./clients.json", $result_json);

if(!$res){
	die("file_put_contents fails".PHP_EOL);
}
echo("ok".PHP_EOL);
exit (0);

?>