<?php
function errHandle($errNo, $errStr, $errFile, $errLine) {
    $msg = "$errStr in $errFile on line $errLine";
    if ($errNo == E_NOTICE || $errNo == E_WARNING) {
        throw new ErrorException($msg, $errNo);
    } else {
        echo $msg;
    }
}
ini_set('display_startup_errors', 1);
ini_set('display_errors', 1);
error_reporting(-1);
set_error_handler('errHandle');

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
    die("\nerror during downloading vatsim-data.txt\n");
}

preg_match("/!CLIENTS:(.*)" . PHP_EOL . ";" . PHP_EOL . ";" . PHP_EOL . "!SERVERS:/s", $data, $clients);

if (!isset($clients[1])) {
    die("\ncannot parse !CLIENTS\n");
}

preg_match_all("/(.*):" . PHP_EOL . "/", $clients[1], $clients);

if (!isset($clients[1])) {
    die("\ncannot parse !CLIENTS container\n");
}

$clients = $clients[1];

preg_match("/!CLIENTS section -(.*):" . PHP_EOL . "; !PREFILE/", $data, $clients_tpl);

if (!isset($clients_tpl[1])) {
    die("\ncannot parse clients_tpl\n");
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
            "QNH_Mb",
            "QNH_iHg",
            "planned_destairport_lon",
            "planned_destairport_lat",
            "planned_depairport_lon",
            "planned_depairport_lat",
            "planned_minfuel",
            "planned_minenroute",
            "planned_actdeptime",
            "planned_revision",
            "server"
        ))) {
            unset($clients_final[$key][$k]);
        }
    }
}

if (!count($clients_final)) {
	die("\ncount(clients_final) = 0\n");
}

$result_json = false;

$result_json = json_encode($clients_final);

if (!$result_json) {
	die("\njson_encode fails\n");
}

$result_gzip = false;

$result_gzip = gzencode($result_json, 9);

if (!$result_gzip) {
	die("\ngzencode fails\n");
}

$res = false;

$res = file_put_contents("./clients.json", $result_gzip);

if(!$res){
	die("\nfile_put_contents fails\n");
}

exit (0);

?>